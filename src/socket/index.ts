import { Server } from 'socket.io';
import { PubSub } from '@google-cloud/pubsub';

import socketIO from '../beast/clients/socket.io';
import { Order } from '../types';
import logger from '../beast/logger';
import config from '../beast/config';

const prefix = '[socket logic]';
const pubSubClient = new PubSub();

const mapOrder = (order: Order): Partial<Order> => {
  return order;
};

const listenForOrderCreated = () => {
  const subscription = pubSubClient.subscription(
    'beast-socket-order-created-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      const mapped = mapOrder(order);
      const io = socketIO.connection();
      logger.info(
        `${prefix} Sending order created to customer ${order.customer.id}`,
      );
      io.emit(order.customer.id, mapped);
      logger.info(
        `${prefix} Sending sale created to seller ${order.transaction.store.user}`,
      );
      io.emit(order.transaction.store.user, mapped);
    } catch (error) {
      logger.error(
        { err: error },
        `${prefix} Unexpected error listening order.created event`,
      );
    } finally {
      message.ack();
    }
  });
  logger.info(`${prefix} Socket order.created listener was created`);
};

const listenForOrderConfirmed = () => {
  const subscription = pubSubClient.subscription(
    'beast-socket-order-confirmed-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      const mapped = mapOrder(order);
      const io = socketIO.connection();
      logger.info(
        `${prefix} Sending order confirmed to customer ${order.customer.id}`,
      );
      io.emit(order.customer.id, mapped);
      logger.info(
        `${prefix} Sending sale created to seller ${order.transaction.store.user}`,
      );
      io.emit(order.transaction.store.user, mapped);
    } catch (error) {
      logger.error(
        { err: error },
        `${prefix} Unexpected error listening order.confirmed event`,
      );
    } finally {
      message.ack();
    }
  });
  logger.info(`${prefix} Socket order.confirmed listener was created`);
};

const listenForOrderDelivered = () => {
  const subscription = pubSubClient.subscription(
    'beast-socket-order-delivered-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      const mapped = mapOrder(order);
      const io = socketIO.connection();
      logger.info(
        `${prefix} Sending order delivered to customer ${order.customer.id}`,
      );
      io.emit(order.customer.id, mapped);
      logger.info(
        `${prefix} Sending sale delivered to seller ${order.transaction.store.user}`,
      );
      io.emit(order.transaction.store.user, mapped);
    } catch (error) {
      logger.error(
        { err: error },
        `${prefix} Unexpected error listening order.delivered event`,
      );
    } finally {
      message.ack();
    }
  });
  logger.info(`${prefix} Socket order.delivered listener was created`);
};

const listenForOrderCancelled = () => {
  const subscription = pubSubClient.subscription(
    'beast-socket-order-cancelled-us-central-1',
  );
  subscription.on('message', (message: any) => {
    const order: Order = JSON.parse(message.data);
    try {
      const mapped = mapOrder(order);
      const io = socketIO.connection();
      logger.info(
        `${prefix} Sending order cancelled to customer ${order.customer.id}`,
      );
      io.emit(order.customer.id, mapped);
      logger.info(
        `${prefix} Sending sale cancelled to seller ${order.transaction.store.user}`,
      );
      io.emit(order.transaction.store.user, mapped);
    } catch (error) {
      logger.error(
        { err: error },
        `${prefix} Unexpected error listening order.cancelled event`,
      );
    } finally {
      message.ack();
    }
  });
  logger.info(`${prefix} Socket order.cancelled listener was created`);
};

socketIO.on('socket.initialized', (io: Server) => {
  io.on('connection', (socket) => {
    logger.info(`${prefix} Socket client connected`);
    socket.on('disconnect', (reason) => {
      logger.info(`${prefix} Socket client disconnected, reason: ${reason}`);
    });
  });

  listenForOrderCreated();
  listenForOrderConfirmed();
  listenForOrderDelivered();
  listenForOrderCancelled();
  logger.info('');
});
