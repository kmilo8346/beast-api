import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// types
import { User } from '../../types';
// beast
import logger from '../../beast/logger';

const run = async () => {
  try {
    logger.info('Modifying notifications index');
    logger.info('');
    await backup(
      'notifications',
      path.join(__dirname, 'tmp/notifications.json'),
    );
    //
    await restore<User>(
      'notifications',
      path.join(__dirname, 'tmp/notifications.json'),
      (collection) => collection,
      {
        mappings: {
          properties: {
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    );
  } catch (error) {
    logger.error(
      { err: error },
      'Unexpected error in modify notifications index',
    );
  }
};

run();
