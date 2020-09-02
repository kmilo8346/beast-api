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

async function createSubscription(topicName, subscriptionName) {
  try {
    console.log(
      `Creating subscription ${subscriptionName} for topic ${topicName}`,
    );
    await pubSubClient.topic(topicName).createSubscription(subscriptionName);
    console.log(`Subscription ${subscriptionName} created.`);
  } catch (error) {
    console.error(error);
  }
}

async function run() {
  console.log('Creating topics...');
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

  console.log('Creating subscriptions...');
  await createSubscription(
    `${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/order.created`,
    'beast-socket-order-created-us-central-1',
  );
  await createSubscription(
    `${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/order.confirmed`,
    'beast-socket-order-confirmed-us-central-1',
  );
  await createSubscription(
    `${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/order.delivered`,
    'beast-socket-order-delivered-us-central-1',
  );
  await createSubscription(
    `${process.env.GOOGLE_PUB_SUB_TOPIC_PREFIX}/order.cancelled`,
    'beast-socket-order-cancelled-us-central-1',
  );
  process.exit(0);
}

run();
