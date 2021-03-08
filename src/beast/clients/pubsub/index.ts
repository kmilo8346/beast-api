import Error from 'verror';
import { PubSub } from '@google-cloud/pubsub';

import config from '../../config';
import logger from '../../logger';

const prefix = '[pubsub client]';
const pubSubClient = new PubSub();

class PubSubClient {
  /**
   * Publish event in Google PubSub
   * @param event
   * @param id
   * @param payload
   */
  async publish(event: string, id: string, payload: any) {
    try {
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(payload)), {
          id,
          time: new Date().toISOString(),
          source: 'beast-api',
        });
      logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { event, id, payload } },
        `${prefix} Unexpected error publishing event`,
      );
    }
  }
}

export default new PubSubClient();
