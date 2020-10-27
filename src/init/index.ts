import { PubSub } from '@google-cloud/pubsub';

import config from '../beast/config';
import logger from '../beast/logger';

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

const run = async () => {
  logger.info(`${prefix} Initializing beast api...`);

  logger.info(`${prefix}`);

  logger.info(`${prefix} Creating topics...`);
  await createTopic('store.updated');
  await createTopic('order.created');

  logger.info('');
  process.exit(0);
};

run();
