import { Client, ClientOptions } from '@elastic/elasticsearch';
import config from '../../config';
import logger from '../../logger';

const log = logger.child({ module: 'elastic-client' });

const clientOptions: ClientOptions = {
  node: config.get('ELASTIC_NODE'),
};
const username = config.get('ELASTIC_USERNAME');
const password = config.get('ELASTIC_PASSWORD');
const withBasiAuth = username && password;
if (withBasiAuth) {
  clientOptions.auth = { username, password };
}

log.info('Creating elastic client');
log.info(`Elastic Node: ${clientOptions.node}`);
if (withBasiAuth) {
  log.info(`Elastic Basic Auth: ${username} *******`);
}
log.info('');

export default new Client(clientOptions);
