import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// types
import { Device, User } from '../../types';
// beast
import logger from '../../beast/logger';
import utils from '../../beast/utils';

const run = async () => {
  try {
    logger.info('Modifying devices index');
    logger.info('');
    await backup('devices', path.join(__dirname, 'tmp/devices.json'));
    //
    await restore<Device>(
      'devices',
      path.join(__dirname, 'tmp/devices.json'),
      (collection) =>
        collection.map((item) => {
          const r = {
            ...item,
          };
          if (item.app_version) {
            r.app_version_num = utils.convertVersionToInt(item.app_version);
          }
          return r;
        }),
      {
        mappings: {
          properties: {
            user_location: {
              type: 'geo_point',
            },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    );
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error in modify devices index');
  }
};

run();
