import Joi from '@hapi/joi';
import { PubSub } from '@google-cloud/pubsub';
import Router, { IMiddleware } from 'koa-router';
import { EventEmitter } from 'events';
import { Transform } from 'stream';

// beast
import logger from '../../../beast/logger';
// types
import { Order } from '../../../types';

class SSEStream extends Transform {
  constructor() {
    super({
      writableObjectMode: true,
    });
  }

  _transform(data: any, _encoding: any, done: () => void) {
    this.push(`data: ${JSON.stringify(data)}\n\n`);
    done();
  }
}

const prefix = '[orders stream]';
const pubSubClient = new PubSub();
const events = new EventEmitter();
events.setMaxListeners(0);

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const query = await Joi.object({
      filters: Joi.object()
        .keys({
          seller: Joi.string().required(),
        })
        .required(),
    }).validateAsync(ctx.state.query, {
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
  router.get('/orders', validate, async (ctx: any) => {
    try {
      const seller = ctx.state.query.filters.seller;
      ctx.request.socket.setTimeout(0);
      ctx.req.socket.setNoDelay(true);
      ctx.req.socket.setKeepAlive(true);

      ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      const stream = new SSEStream();
      ctx.status = 200;
      ctx.body = stream;

      const listener = (data: Order) => {
        stream.write(data);
      };

      events.on(seller, listener);

      stream.on('close', () => {
        events.off(seller, listener);
      });

      ctx.req.on('close', () => {
        events.off(seller, listener);
      });
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};

const listenForOrderCreated = () => {
  const subscription = pubSubClient.subscription(
    'beast-long-polling-order-created-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      logger.info(
        `${prefix} Emitting order created to seller ${order.transaction.shopping_cart.store.user}`,
      );
      events.emit(order.transaction.shopping_cart.store.user, order);
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

listenForOrderCreated();
logger.info('');
