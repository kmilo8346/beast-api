import path from 'path';

import logger from '../../logger';
import config from '../../config';

// eslint-disable-next-line import/no-dynamic-require
const packageJSON = require(path.join(process.cwd(), 'package.json'));
const prefix = '[info client]';

logger.info(`${prefix} Project          : ${packageJSON.name}`);
logger.info(`${prefix} Version          : ${packageJSON.version}`);
logger.info(`${prefix} Environment      : ${config.get('ENVIRONMENT')}`);
logger.info(`${prefix} Node Environment : ${config.get('NODE_ENV')}`);
logger.info('');

export default packageJSON;
