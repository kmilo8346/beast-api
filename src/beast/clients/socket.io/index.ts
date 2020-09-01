import http from 'http';
import io from 'socket.io';
import events from 'events';

import logger from '../../logger';

const prefix = '[socket.io client]';

class SocketIO extends events.EventEmitter {
  private server: io.Server | undefined;

  initialize(server: http.Server) {
    this.server = io(server, {});

    logger.info(`${prefix} Module     : Socket io client`);
    logger.info(`${prefix} Status     : initalized`);
    logger.info('');

    this.emit('socket.initialized', this.server);
  }

  connection(): io.Server {
    if (!this.server) {
      throw new Error(`${prefix} Socket io server is not initialized`);
    }

    return this.server;
  }
}

export default new SocketIO();
