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
  await createTopic(process.env.GOOGLE_PUB_SUB_TOPIC_SHOPS_CREATED);
  await createTopic(process.env.GOOGLE_PUB_SUB_TOPIC_PAYMENTS_PENDING);
  await createTopic(process.env.GOOGLE_PUB_SUB_TOPIC_ORDERS_PENDING);
}

run();
