import pino from 'pino';

const options: pino.LoggerOptions = {
  name: 'beast-api',
  messageKey: 'message',
};

export default pino(options);
