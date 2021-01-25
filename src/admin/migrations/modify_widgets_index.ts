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
    logger.info('Modifying widgets index');
    logger.info('');
    await backup('widgets', path.join(__dirname, 'tmp/widgets.json'));
    //
    await restore<User>(
      'widgets',
      path.join(__dirname, 'tmp/widgets.json'),
      (collection) => collection,
      {
        mappings: {
          properties: {
            instructions: {
              type: 'object',
              enabled: false,
            },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    );
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error in modify widgets index');
  }
};

run();
