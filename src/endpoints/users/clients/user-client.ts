/* eslint-disable object-curly-newline */
import Error from 'verror';

import elastic from '../../../beast/clients/elastic';
import { CreateParams, UpdateParams, CreateUser, User } from '../../../types';
import utils from '../../../beast/utils';

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
   * Create user
   * @param params CreateParams<CreateUser>
   * @returns Promise<User>
   */
  async create(params: CreateParams<CreateUser>): Promise<User> {
    try {
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
      const response = await elastic.index({
        index,
        id,
        refresh: 'true',
        body: newUser,
      });
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
