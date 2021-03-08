import Error from 'verror';

import {
  SearchParams,
  SearchResponse,
  CreateParams,
  Notification,
  CreateNotification,
  NotificationStatus,
} from '../../../types';
import utils from '../../../beast/utils';
import logger from '../../../beast/logger';
import config from '../../../beast/config';
import pubsub from '../../../beast/clients/pubsub';
import elastic from '../../../beast/clients/elastic';

const index = 'notifications';
const prefix = '[notification client]';

class NotificationClient {
  /**
   * Get notification
   * @param id string
   * @param source string[]
   * @returns Promise<Notification>
   */
  public async get(id: string, source?: string[]): Promise<Notification> {
    try {
      const response = await elastic.get({
        id,
        index,
        _source: source,
      });
      return {
        ...response.body._source,
        id: response.body._id,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, source } },
        `${prefix} Unexpected error getting notification`,
      );
    }
  }

  /**
   * Search notifications
   * @param params SearchParams
   * @returns Promise<SearchResponse<Notification>
   */
  async search(params: SearchParams): Promise<SearchResponse<Notification>> {
    try {
      // filters
      const bool: any = {
        must: [],
        filter: [],
        must_not: [],
      };
      if (params.filters) {
        if ('reference' in params.filters) {
          bool.must.push({
            match_phrase: {
              'reference.keyword': {
                query: params.filters.reference,
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
        `${prefix} Unexpected error searching notifications`,
      );
    }
  }

  /**
   * Create a notification
   * @param params CreateParams<CreateNotification>
   * @returns Promise<Notification>
   */
  async create(
    params: CreateParams<CreateNotification>,
  ): Promise<Notification> {
    try {
      // find already created notification
      if (params.body.reference) {
        const searchResponse = await this.search({
          filters: { reference: params.body.reference },
          from: 0,
          size: 1,
          source: params.source,
        });
        if (searchResponse.hits.length) {
          const alreadyCreated = searchResponse.hits[0] as Notification;
          logger.info(
            `${prefix} A notification is already created, notification id ${alreadyCreated.id}, reference ${alreadyCreated.reference}`,
          );
          return alreadyCreated;
        }
      }

      let newNotification: any = {
        ...params.body,
        status: NotificationStatus.CREATED,
        stats: {
          devices_ok: 0,
          devices_error: 0,
          notification_open: 0,
          send_product_message: 0,
          send_order_message: 0,
          send_question_message: 0,
        },
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newNotification,
      });
      newNotification = {
        ...newNotification,
        id: response.body._id,
      };

      // emit event
      await pubsub.publish(
        'notification.created',
        newNotification.id,
        newNotification,
      );

      return utils.mapObject(newNotification, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating notification`,
      );
    }
  }
}

export default new NotificationClient();
