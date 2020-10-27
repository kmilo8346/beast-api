import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// migration mappers
import storeMap from './mappers/store';
// types
import { Store } from '../../types';
// beast
import logger from '../../beast/logger';

const run = async () => {
  try {
    logger.info('Modifying stores index');
    logger.info('');
    await backup('stores', path.join(__dirname, 'tmp/stores.json'));
    //
    await restore<Store>(
      'stores',
      path.join(__dirname, 'tmp/stores.json'),
      (collection) => collection.map(storeMap),
      {
        mappings: {
          properties: {
            delivery_time: { type: 'integer_range' },
            delivery_area: {
              properties: {
                center: {
                  properties: {
                    location: {
                      type: 'geo_point',
                    },
                  },
                },
                geometry: {
                  type: 'geo_shape',
                  strategy: 'recursive',
                },
              },
            },
            opening_hours: { type: 'nested' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    );
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error in modify stores index');
  }
};

run();
