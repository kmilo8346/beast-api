import Error from 'verror';
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
const index = 'stores';

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
      const response = await elastic.get({
        index,
        id: utils.parseId(id),
        _source: source,
      });
      return {
        ...response.body._source,
        id: response.body._id,
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
        index,
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
        filters: params.filters,
        from: params.from,
        size: params.size,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id }: any) => ({
          ..._source,
          id: _id,
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
        source: params.source,
      });
      if (searchResponse.hits.length) {
        const alreadyCreated = searchResponse.hits[0] as Store;
        logger.info(
          `${prefix} A store is already created, store id ${alreadyCreated.id}, reference ${alreadyCreated.reference}`,
        );
        return alreadyCreated;
      }

      const newStore = {
        ...params.body,
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
          id: response.body._id,
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
      const _id = utils.parseId(id);
      let update = {
        ...params.body,
        updated_at: new Date(),
      };
      await elastic.update({
        index,
        id: _id,
        body: {
          doc: update,
        },
      });
      update = {
        ...update,
        id: _id,
      };

      // emit event
      const event = 'store.updated';
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(update)), {
          id: _id,
          time: new Date().toISOString(),
          source: 'beast-api',
        });
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
      await elastic.delete({
        index,
        id: utils.parseId(id),
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
