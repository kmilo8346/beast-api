import Error from 'verror';
import moment from 'moment';

import elastic from '../../../beast/clients/elastic';
import {
  SearchParams,
  SearchResponse,
  CreateParams,
  UpdateParams,
  Device,
  CreateDevice,
} from '../../../types';
import utils from '../../../beast/utils';

const prefix = '[device client]';

class DeviceClient {
  /**
   * Search devices
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse<Device>> {
    try {
      // filters
      const must: any[] = [];
      if (params.filters) {
        if (params.filters.user) {
          must.push({
            match_phrase: {
              'user_id.keyword': {
                query: params.filters.user,
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
        index: 'devices-*',
        body: {
          query: {
            bool: {
              must,
            },
          },
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
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: `${_index}|${_id}`,
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
      const index = `devices-${moment().format('YYYY-MM-DD')}`;
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      });

      const newDevice = {
        ...params.body,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newDevice,
      });
      return utils.mapObject(
        {
          ...newDevice,
          id: `${response.body._index}|${response.body._id}`,
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
  async update(id: string, params: UpdateParams<Device>): Promise<void> {
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
      const [_index, _id] = id.split('|');
      await elastic.delete({
        index: _index,
        id: _id,
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
