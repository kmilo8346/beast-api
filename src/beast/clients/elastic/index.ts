import { Client, ClientOptions } from '@elastic/elasticsearch';
import config from '../../config';
import logger from '../../logger';

const prefix = '[elastic client]';

const clientOptions: ClientOptions = {
  node: config.get('ELASTIC_NODE'),
};
const username = config.get('ELASTIC_USERNAME');
const password = config.get('ELASTIC_PASSWORD');
const withBasiAuth = username && password;
if (withBasiAuth) {
  clientOptions.auth = { username, password };
}

logger.info(`${prefix} Client     : elastic`);
logger.info(`${prefix} Node       : ${clientOptions.node}`);
if (withBasiAuth) {
  logger.info(`${prefix} Basic Auth : ${username} *******`);
}
logger.info('');

export default new Client(clientOptions);
