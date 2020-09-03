import { PubSub } from '@google-cloud/pubsub';

import config from './config';
import logger from './logger';

const prefix = '[init logic]';
const pubSubClient = new PubSub();

const createTopic = async (topicName: string) => {
  try {
    await pubSubClient.createTopic(
      `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${topicName}`,
    );
    logger.info(`${prefix} ${topicName} ✓`);
  } catch (error) {
    if (error.code === 6) {
      logger.info(`${prefix} ${topicName} ✓`);
      return;
    }
    throw error;
  }
};

const createSubscription = async (
  topicName: string,
  subscriptionName: string,
) => {
  try {
    await pubSubClient
      .topic(`${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${topicName}`)
      .createSubscription(subscriptionName);
    logger.info(`${prefix} ${subscriptionName} ✓`);
  } catch (error) {
    if (error.code === 6) {
      logger.info(`${prefix} ${subscriptionName} ✓`);
      return;
    }
    throw error;
  }
};

export default async () => {
  logger.info(`${prefix} Initializing server...`);
  if (config.get('ENVIRONMENT') === 'local') {
    logger.info(`${prefix}`);

    logger.info(`${prefix} Creating topics...`);
    await createTopic('payment.approved');
    await createTopic('order.created');
    await createTopic('order.confirmed');
    await createTopic('order.delivered');
    await createTopic('order.cancelled');

    logger.info(`${prefix}`);
    logger.info(`${prefix} Creating subscriptions...`);
    await createSubscription(
      'order.created',
      'beast-socket-order-created-us-central-1',
    );
    await createSubscription(
      'order.confirmed',
      'beast-socket-order-confirmed-us-central-1',
    );
    await createSubscription(
      'order.delivered',
      'beast-socket-order-delivered-us-central-1',
    );
    await createSubscription(
      'order.cancelled',
      'beast-socket-order-cancelled-us-central-1',
    );
  }
  logger.info('');
};
