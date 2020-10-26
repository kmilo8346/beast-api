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
    // await backup('stores', path.join(__dirname, 'tmp/stores.json'));
    //
    await restore<Store>(
      'stores',
      path.join(__dirname, 'tmp/stores.json'),
      (collection) =>
        collection.map<Store>((store) => {
          const s = store as any;
          return {
            id: s.id.includes('|') ? s.id.split('|')[1] : s.id,
            user: s.user,
            phone: s.phone,
            reference: s.reference,
            name: s.name,
            images: s.images,
            delivery_area: s.delivery_area,
            delivery_time: s.delivery_time,
            opening_hours: s.opening_hours,
            created_at: s.created_at,
            updated_at: s.updated_at,
            seller_credentials: s.payment_provider.credentials,
            payment_provider: 'mercadopago',
            dispatch_provider: 'owner',
          } as any;
        }) as Store[],
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
