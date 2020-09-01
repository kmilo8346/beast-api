import { Server } from 'socket.io';

import socketIO from '../beast/clients/socket.io';
import { Order } from '../types';
import logger from '../beast/logger';

const prefix = '[socket logic]';

socketIO.on('socket.initialized', (io: Server) => {
  io.on('connection', (socket) => {
    socket.on('order.created', (order: Order) => {
      logger.info(
        `${prefix} Sending order created to user ${order.customer.id}`,
      );
      socket.broadcast.emit(order.customer.id, order);
      logger.info(
        `${prefix} Sending sale created to seller ${order.transaction.store.user}`,
      );
      socket.broadcast.emit(order.transaction.store.user, order);
    });

    socket.on('order.confirmed', (order: Order) => {
      logger.info(
        `${prefix} Sending order confirmed to user ${order.customer.id}`,
      );
      socket.broadcast.emit(order.customer.id, order);
      logger.info(
        `${prefix} Sending sale confirmed to seller ${order.transaction.store.user}`,
      );
      socket.broadcast.emit(order.transaction.store.user, order);
    });

    socket.on('order.delivered', (order: Order) => {
      logger.info(
        `${prefix} Sending order delivered to user ${order.customer.id}`,
      );
      socket.broadcast.emit(order.customer.id, order);
      logger.info(
        `${prefix} Sending sale delivered to seller ${order.transaction.store.user}`,
      );
      socket.broadcast.emit(order.transaction.store.user, order);
    });

    socket.on('order.cancelled', (order: Order) => {
      logger.info(
        `${prefix} Sending order cancelled to user ${order.customer.id}`,
      );
      socket.broadcast.emit(order.customer.id, order);
      logger.info(
        `${prefix} Sending sale cancelled to seller ${order.transaction.store.user}`,
      );
      socket.broadcast.emit(order.transaction.store.user, order);
    });
  });
});
