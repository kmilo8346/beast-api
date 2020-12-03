import Error from 'verror';
import lodash from 'lodash';
import moment from 'moment-timezone';
import { PubSub } from '@google-cloud/pubsub';

import utils from '../../../beast/utils';
import elastic from '../../../beast/clients/elastic';
import {
  SearchParams,
  SearchResponse,
  Store,
  CreateStore,
  CreateParams,
  UpdateParams,
} from '../../../types';
import logger from '../../../beast/logger';
import config from '../../../beast/config';

const prefix = '[store client]';
const pubSubClient = new PubSub();

/**
 * @class StoreClient
 */
class StoreClient {
  /**
   * Get store
   * @param id string
   * @param source string[]
   * @returns Promise<Store>
   */
  public async get(id: string, source?: string[]): Promise<Store> {
    try {
      const [_index, _id] = id.split('|');
      const response = await elastic.get({
        index: _index,
        id: _id,
        _source: source,
      });
      return {
        ...response.body._source,
        id: `${response.body._index}|${response.body._id}`,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, source } },
        `${prefix} Unexpected error getting store`,
      );
    }
  }

  /**
   * Search stores
   * @param params
   */
  public async search(params: SearchParams): Promise<SearchResponse<Store>> {
    try {
      // filters
      const bool: any = {
        must: [],
        filter: [],
      };
      if (params.filters) {
        if ('user' in params.filters) {
          bool.must.push({
            match_phrase: {
              'user.keyword': {
                query: params.filters.user,
              },
            },
          });
        }
        if ('location' in params.filters) {
          bool.filter.push({
            geo_shape: {
              'delivery_area.geometry': {
                shape: {
                  type: 'Point',
                  coordinates: [
                    params.filters.location.lon,
                    params.filters.location.lat,
                  ],
                },
                relation: 'intersects',
              },
            },
          });
        }
        if ('open' in params.filters) {
          if (params.filters.open) {
            // TODO: add support for other countries
            const date = moment().tz('America/Santiago');
            let day = `${date.day()}`;
            const minutes = date.minutes();
            const time = parseInt(
              `${date.hour()}${minutes < 10 ? `0${minutes}` : minutes}`,
              10,
            );
            if (day === '0') {
              day = '7';
            }

            bool.must.push({
              nested: {
                path: 'opening_hours',
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          'opening_hours.day': day,
                        },
                      },
                      {
                        range: {
                          'opening_hours.open': {
                            lte: time,
                          },
                        },
                      },
                      {
                        range: {
                          'opening_hours.close': {
                            gt: time,
                          },
                        },
                      },
                    ],
                  },
                },
              },
            });
          }
        }
        if ('reference' in params.filters) {
          bool.must.push({
            match_phrase: {
              'reference.keyword': {
                query: params.filters.reference,
              },
            },
          });
        }
        if ('enabled' in params.filters) {
          bool.must.push({
            match_phrase: {
              enabled: {
                query: params.filters.enabled,
              },
            },
          });
        }
        if ('slug' in params.filters) {
          bool.must.push({
            match_phrase: {
              'slug.keyword': {
                query: params.filters.slug,
              },
            },
          });
        }
      }

      // sort
      let sort: { [key: string]: { order: 'desc' | 'asc' } }[] = [
        { updated_at: { order: 'desc' } },
      ];
      if (params.sort) {
        sort = Object.keys(params.sort).map((field) => ({
          [field]: { order: (params.sort as any)[field] },
        }));
      }

      const response = await elastic.search({
        index: 'stores*',
        body: {
          query: {
            bool,
          },
          sort,
          from: params.from,
          size: params.size,
          _source: params.source,
        },
      });

      return {
        query: params.query,
        filters: params.filters,
        from: params.from,
        size: params.size,
        sort: params.sort,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: `${_index}|${_id}`,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching stores`,
      );
    }
  }

  /**
   * Create store
   * @param params CreateParams<CreateStore>
   * @returns Promise<Store>
   */
  public async create(params: CreateParams<CreateStore>): Promise<Store> {
    try {
      // find already created store
      const searchResponse = await this.search({
        filters: { reference: params.body.reference },
        from: 0,
        size: 1,
      });
      if (searchResponse.hits.length) {
        const alreadyCreated = searchResponse.hits[0] as Store;
        logger.info(
          `${prefix} A store is already created, store id ${alreadyCreated.id}, reference ${alreadyCreated.reference}`,
        );
        return utils.mapObject(alreadyCreated, params.source);
      }

      // create index if not exist
      const index = 'stores';
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            delivery_time: { type: 'integer_range' },
            delivery_area: {
              properties: {
                center: {
                  properties: {
                    location: {
                      type: 'geo_point',
                    },
                  },
                },
                geometry: {
                  type: 'geo_shape',
                  strategy: 'recursive',
                },
              },
            },
            opening_hours: { type: 'nested' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      });

      const newStore = {
        ...params.body,
        slug: utils.convertNameToSlug(params.body.name),
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newStore,
      });
      return utils.mapObject(
        {
          ...newStore,
          id: `${response.body._index}|${response.body._id}`,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating store`,
      );
    }
  }

  /**
   * Update a store
   * @param params
   */
  public async update(
    id: string,
    params: UpdateParams<Store>,
  ): Promise<Partial<Store>> {
    try {
      const [_index, _id] = id.split('|');
      const update = {
        ...params.body,
        updated_at: new Date(),
      };
      if (params.body.name) {
        update.slug = utils.convertNameToSlug(params.body.name);
      }
      const response = await elastic.update({
        index: _index,
        id: _id,
        body: {
          doc: update,
          _source: true, // use true to get entity
        },
      });
      // emit event
      const event = 'store.updated';
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient.topic(topic).publish(
        Buffer.from(
          JSON.stringify({
            id,
            ...response.body.get._source,
          }),
        ),
        {
          id,
          time: new Date().toISOString(),
          source: 'beast-api',
        },
      );
      logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`,
      );

      return utils.mapObject(update, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        `${prefix} Unexpected error updating store`,
      );
    }
  }

  /**
   * Delete a store
   * @param id
   */
  async delete(id: string): Promise<void> {
    try {
      const [_index, _id] = id.split('|');
      await elastic.delete({
        index: _index,
        id: _id,
        refresh: 'true',
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { id } },
        `${prefix} Unexpected error deleting store`,
      );
    }
  }
}

export default new StoreClient();
