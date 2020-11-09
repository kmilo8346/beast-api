import Error from 'verror';

// types
import {
  CreateParams,
  UpdateParams,
  SearchParams,
  SearchResponse,
  User,
  CreateUser,
  Place,
} from '../../../types';
// beast
import elastic from '../../../beast/clients/elastic';
import utils from '../../../beast/utils';
import logger from '../../../beast/logger';

const prefix = '[user client]';

class UserClient {
  /**
   * Get user
   * @param id string
   * @param source string[]
   * @returns Promise<User>
   */
  public async get(id: string, source?: string[]): Promise<User> {
    try {
      const response = await elastic.get({
        index: 'users',
        id,
        _source: source,
      });
      return {
        ...response.body._source,
        id: response.body._id,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, source } },
        `${prefix} Unexpected error getting user`,
      );
    }
  }

  /**
   * Search users
   * @param params SearchParams
   * @returns Promise<SearchResponse<User>>
   */
  public async search(params: SearchParams): Promise<SearchResponse<User>> {
    try {
      // filters
      const bool: any = {
        must: [],
        filter: [],
      };
      if (params.filters) {
        if ('phone' in params.filters) {
          bool.must.push({
            match_phrase: {
              'phone.keyword': {
                query: params.filters.phone,
              },
            },
          });
        }
        if ('id' in params.filters) {
          bool.must.push({
            match_phrase: {
              _id: {
                query: params.filters.id,
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
        index: 'users*',
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
        `${prefix} Unexpected error searching users`,
      );
    }
  }

  /**
   * Create user
   * @param params CreateParams<CreateUser>
   * @returns Promise<User>
   */
  async create(params: CreateParams<CreateUser>): Promise<User> {
    try {
      // find already created user by phone
      if (params.body.phone && params.body.phone_verified) {
        const searchResponse = await this.search({
          filters: { phone: params.body.phone },
          from: 0,
          size: 1,
        });
        if (searchResponse.hits.length) {
          let alreadyCreated = searchResponse.hits[0] as User;

          logger.info(
            `${prefix} Merging address info with a already user created`,
          );
          const addressIds = (params.body.addresses || []).map(
            (address: Place) => address.id,
          );
          const addresses = Array.prototype.concat(
            params.body.addresses || [],
            (alreadyCreated.addresses || []).filter(
              (address: Place) => addressIds.indexOf(address.id) === -1,
            ),
          );
          const current_address =
            params.body.current_address || alreadyCreated.current_address;
          alreadyCreated = {
            ...alreadyCreated,
            current_address,
            addresses,
            phone_verified: true,
          };
          const { id, ...update } = alreadyCreated;
          await this.update(id, { body: update });

          logger.info(
            `${prefix} Returning a already user created,  found by phone, user id ${alreadyCreated.id}, phone ${alreadyCreated.phone}`,
          );
          return utils.mapObject(alreadyCreated, params.source);
        }
      }
      // find already created user by id
      if (params.body.id) {
        const searchResponse = await this.search({
          filters: { id: params.body.id },
          from: 0,
          size: 1,
        });
        if (searchResponse.hits.length) {
          let alreadyCreated = searchResponse.hits[0] as User;
          const { id, ...update } = params.body;
          alreadyCreated = {
            ...alreadyCreated,
            ...update,
          };
          await this.update(id, { body: alreadyCreated });
          logger.info(
            `${prefix} Returning a already user created, found by id, user id ${alreadyCreated.id}, phone ${alreadyCreated.phone}`,
          );
          return utils.mapObject(alreadyCreated, params.source);
        }
      }

      // create index if not exist
      const index = 'users';
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            addresses: {
              type: 'nested',
              properties: {
                location: {
                  type: 'geo_point',
                },
              },
            },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      });

      const { id, ...data } = params.body;
      const newUser = {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const payload: any = {
        index,
        refresh: 'true',
        body: newUser,
      };
      if (id) {
        payload.id = id;
      }
      const response = await elastic.index(payload);
      return utils.mapObject(
        {
          ...newUser,
          id: response.body._id,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating user`,
      );
    }
  }

  /**
   * Update user
   * @param id string
   * @param params UpdateParams<User>
   * @returns Promise<void>
   */
  async update(id: string, params: UpdateParams<User>): Promise<void> {
    try {
      // TODO: remove when all clients app version > 1.5.9
      if (params.body.phone) {
        const searchResponse = await this.search({
          filters: { phone: params.body.phone },
          from: 0,
          size: 1,
        });
        if (searchResponse.hits.length) {
          const alreadyCreated = searchResponse.hits[0] as User;
          if (alreadyCreated.id !== id) {
            throw new Error(`${prefix} Can´t assign phone from other account`);
          }
        }
      }

      await elastic.update({
        index: 'users',
        id,
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
        `${prefix} Unexpected error updating user`,
      );
    }
  }

  /**
   * Delete user
   * @param id string
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    try {
      await elastic.delete({
        index: 'users',
        id,
        refresh: 'true',
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { id } },
        `${prefix} Unexpected error deleting user`,
      );
    }
  }
}

export default new UserClient();
