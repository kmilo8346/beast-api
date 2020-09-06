import Router, { IMiddleware } from 'koa-router';
import { PubSub } from '@google-cloud/pubsub';
import events from 'events';
import Joi from '@hapi/joi';

import orderClient from '../../../orders/clients/order-client';
import logger from '../../../../beast/logger';
import { Order } from '../../../../types';

const prefix = '[long polling orders]';
const pollingTimeout = 30 * 1000;
const bus = new events.EventEmitter();
const pubSubClient = new PubSub();

const responseResolver = () => {
  let promiseResolve: (value?: unknown) => void = () => null;
  let promiseReject: (value?: unknown) => void = () => null;

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });

  return {
    promise,
    resolve: promiseResolve,
    reject: promiseReject,
  };
};

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const query = await Joi.object({
      filters: Joi.object()
        .keys({
          water_mark: Joi.string().required(),
          should_customer: Joi.string().required(),
          should_seller: Joi.string().required(),
        })
        .required(),
      from: Joi.number().integer().min(0).default(0),
      size: Joi.number().min(0).max(100).default(10),
      sort: Joi.object().optional(),
      source: Joi.array().items(Joi.string()).optional(),
    }).validateAsync(ctx.query, {
      convert: true,
      stripUnknown: true,
    });
    // set formatted query
    ctx.state.query = query;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.get('/subscribe', validate, async (ctx) => {
    let timeout: NodeJS.Timeout | undefined;
    let listener: (data: Order) => void = () => null;
    const user = ctx.query.filters.should_customer;
    let finished = false;

    try {
      const orders = await orderClient.search(ctx.query);
      if (orders.hits.length) {
        ctx.body = orders.hits;
        return;
      }

      logger.info(`${prefix} aki1`);
      // subscribing logic
      const resolver = responseResolver();

      // request timeout
      timeout = setTimeout(() => {
        ctx.body = [];
        resolver.resolve();
      }, pollingTimeout);

      // listening data
      listener = (data: Order) => {
        logger.info(`${prefix} Data received for event: ${user}`);
        ctx.body = [data];
        resolver.resolve();
      };
      bus.on(user, listener);
      logger.info(
        `${prefix} Listener was added for event ${user}, count for this event ${bus.listenerCount(
          user,
        )}`,
      );
      logger.info(`${prefix} Events in bus, ${bus.eventNames()}`);

      // usefull for connection closed from client or proxy
      ctx.req.on('close', () => {
        if (!finished) {
          logger.info(`${prefix} Close was called before logic finish`);
        }
        resolver.resolve();
      });

      await resolver.promise;
      finished = true;
    } catch (error) {
      ctx.throw(500, error);
    } finally {
      logger.info(`${prefix} aki2`);
      if (timeout) {
        clearTimeout(timeout);
        logger.info(`${prefix} Timeout was cleared`);
      }
      bus.removeListener(user, listener);
      logger.info(
        `${prefix} Listener was removed for event ${user}, count for this event ${bus.listenerCount(
          user,
        )}`,
      );
      bus.removeListener(user, listener);
      logger.info(
        `${prefix} Listener was removed for event ${user}, count for this event ${bus.listenerCount(
          user,
        )}`,
      );
    }
  });
};

bus.on('AWVkRvWD1FgmNioW7pqpthwt9vU2', () => {
  logger.info(`${prefix} Entró al listener statico`);
});

const listenForOrderCreated = () => {
  const subscription = pubSubClient.subscription(
    'beast-long-polling-order-created-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      logger.info(
        `${prefix} Emitting order created to customer ${order.customer.id}`,
      );
      bus.emit(order.customer.id, order);
      logger.info(
        `${prefix} Emitting sale created to seller ${order.transaction.store.user}`,
      );
      bus.emit(order.transaction.store.user, order);
    } catch (error) {
      logger.error(
        { err: error },
        `${prefix} Unexpected error listening order.created event`,
      );
    } finally {
      message.ack();
    }
  });
  logger.info(`${prefix} Long polling order.created listener was created`);
};

const listenForOrderConfirmed = () => {
  const subscription = pubSubClient.subscription(
    'beast-long-polling-order-confirmed-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      logger.info(
        `${prefix} Emitting order confirmed to customer ${order.customer.id}`,
      );
      bus.emit(order.customer.id, order);
      logger.info(
        `${prefix} Emitting sale created to seller ${order.transaction.store.user}`,
      );
      bus.emit(order.transaction.store.user, order);
    } catch (error) {
      logger.error(
        { err: error },
        `${prefix} Unexpected error listening order.confirmed event`,
      );
    } finally {
      message.ack();
    }
  });
  logger.info(`${prefix} Long polling order.confirmed listener was created`);
};

const listenForOrderDelivered = () => {
  const subscription = pubSubClient.subscription(
    'beast-long-polling-order-delivered-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      logger.info(
        `${prefix} Emitting order delivered to customer ${order.customer.id}`,
      );
      bus.emit(order.customer.id, order);
      logger.info(
        `${prefix} Emitting sale delivered to seller ${order.transaction.store.user}`,
      );
      bus.emit(order.transaction.store.user, order);
    } catch (error) {
      logger.error(
        { err: error },
        `${prefix} Unexpected error listening order.delivered event`,
      );
    } finally {
      message.ack();
    }
  });
  logger.info(`${prefix} Long polling order.delivered listener was created`);
};

const listenForOrderCancelled = () => {
  const subscription = pubSubClient.subscription(
    'beast-long-polling-order-cancelled-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      logger.info(
        `${prefix} Emitting order cancelled to customer ${order.customer.id}`,
      );
      bus.emit(order.customer.id, order);
      logger.info(
        `${prefix} Emitting sale cancelled to seller ${order.transaction.store.user}`,
      );
      bus.emit(order.transaction.store.user, order);
    } catch (error) {
      logger.error(
        { err: error },
        `${prefix} Unexpected error listening order.cancelled event`,
      );
    } finally {
      message.ack();
    }
  });
  logger.info(`${prefix} Long polling order.cancelled listener was created`);
};

listenForOrderCreated();
listenForOrderConfirmed();
listenForOrderDelivered();
listenForOrderCancelled();
logger.info('');
