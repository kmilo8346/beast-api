import Error from 'verror';

import {
  SearchParams,
  SearchResponse,
  CreateParams,
  UpdateParams,
  Device,
  CreateDevice,
} from '../../../types';
import utils from '../../../beast/utils';
import elastic from '../../../beast/clients/elastic';

const prefix = '[device client]';
const index = 'devices';

class DeviceClient {
  /**
   * Search devices
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse<Device>> {
    try {
      // filters
      const query: any = {
        bool: {
          must: [],
          filter: [],
          must_not: [],
        },
      };
      if (params.filters) {
        if ('user' in params.filters) {
          query.bool.must.push({
            match_phrase: {
              'user_id.keyword': {
                query: params.filters.user,
              },
            },
          });
        }
        if ('area' in params.filters) {
          query.bool.filter.push({
            geo_distance: {
              distance: params.filters.area.radius,
              user_location: params.filters.area.coordinates,
            },
          });
        }
        if ('token_exists' in params.filters) {
          query.bool.must.push({
            exists: {
              field: 'token.keyword',
            },
          });
        }
        if ('app_version_gte' in params.filters) {
          query.bool.must.push({
            range: {
              app_version_num: {
                gte: utils.convertVersionToInt(params.filters.app_version_gte),
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
          query,
          sort,
          from: params.from,
          size: params.size,
          _source: params.source,
        },
      });

      return {
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
        `${prefix} Unexpected error searching over devices`,
      );
    }
  }

  /**
   * Create a device
   * @param params
   */
  async create(params: CreateParams<CreateDevice>): Promise<Device> {
    try {
      const { id, ...data } = params.body;
      const newDevice: any = {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const payload: any = {
        index,
        refresh: 'true',
        body: newDevice,
      };
      if (id) {
        payload.id = id;
      }
      const response = await elastic.index(payload);
      return utils.mapObject(
        {
          ...newDevice,
          id: response.body._id,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        'Unexpected error creating a device',
      );
    }
  }

  /**
   * Update a device
   * @param params
   */
  async update(
    id: string,
    params: UpdateParams<Device>,
  ): Promise<Partial<Device>> {
    try {
      const _id = utils.parseId(id);
      const update = {
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
      return utils.mapObject({ ...update, id: _id }, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        'Unexpected error updating device',
      );
    }
  }

  /**
   * Delete a device
   * @param params
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
        'Unexpected error deleting device',
      );
    }
  }
}

export default new DeviceClient();
