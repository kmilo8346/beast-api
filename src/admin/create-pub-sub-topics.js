require('dotenv-safe').config();

const { PubSub } = require('@google-cloud/pubsub');

const pubSubClient = new PubSub();

async function createTopic(topicName) {
  try {
    console.log(`Creating topic ${topicName}`);
    await pubSubClient.createTopic(topicName);
    console.log(`Topic ${topicName} created.`);
  } catch (error) {
    console.error(error);
  }
}

async function run() {
  await createTopic(
    `${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/payment.approved`,
  );
  await createTopic(`${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/order.created`);
  await createTopic(
    `${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/order.confirmed`,
  );
  await createTopic(
    `${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/order.delivered`,
  );
  await createTopic(
    `${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/order.cancelled`,
  );
}

run();
