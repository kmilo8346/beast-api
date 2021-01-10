import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// types
import { User } from '../../types';
// beast
import logger from '../../beast/logger';
import utils from '../../beast/utils';

const run = async () => {
  try {
    logger.info('Modifying users index');
    logger.info('');
    await backup('users', path.join(__dirname, 'tmp/users.json'));

    await restore<User>(
      'users',
      path.join(__dirname, 'tmp/users.json'),
      (collection) => collection,
      {
        mappings: {
          properties: {
            addresses: {
              type: 'nested',
              properties: {
                location: {
                  type: 'geo_point',
                },
              },
            },
            current_store: {
              type: 'keyword',
              null_value: 'NULL',
            },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    );
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error in modify users index');
  }
};

run();
