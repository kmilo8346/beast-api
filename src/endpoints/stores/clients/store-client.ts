import Error from 'verror';

import utils from '../../../beast/utils';
import elastic from '../../../beast/clients/elastic';
import {
  SearchParams,
  SearchResponse,
  Store,
  CreateStore,
  CreateParams,
  UpdateParams,
  GetParams,
} from '../../../types';

const prefix = '[store client]';

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
        if (params.filters.user) {
          bool.must.push({
            match_phrase: {
              'user.keyword': {
                query: params.filters.user,
              },
            },
          });
        }
        if (params.filters.location) {
          bool.filter.push({
            geo_shape: {
              'delivery_area.geometry': {
                shape: {
                  type: 'Point',
                  coordinates: [
                    params.filters.location.lng,
                    params.filters.location.lat,
                  ],
                },
                relation: 'intersects',
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
        sort = params.sort.map((s) => ({ [s.field]: { order: s.order } }));
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
      // create index if not exist
      const index = 'stores';
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            delivery_time: { type: 'integer_range' },
            delivery_area: {
              properties: {
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
  public async update(id: string, params: UpdateParams<Store>): Promise<void> {
    try {
      const [_index, _id] = id.split('|');
      await elastic.update({
        index: _index,
        id: _id,
        body: {
          doc: {
            ...params.body,
            updated_at: new Date(),
          },
        },
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        `${prefix} Unexpected error updating store`,
      );
    }
  }
}

export default new StoreClient();
