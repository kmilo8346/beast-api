// eslint-disable-next-line max-len
// npx ts-node -r dotenv-safe/config src/admin/show_users_with_ghost_stores.ts dotenv_config_path=${ENV_PATH} | npx pino-pretty --messageKey message --ignore pid,hostname,name

import Error from 'verror';
import lodash from 'lodash';

import userClient from '../endpoints/users/clients/user-client';
import storeClient from '../endpoints/stores/clients/store-client';

const run = async () => {
  console.log('Script started');
  console.log('');
  console.log('Analizing users');

  let from = 0;
  let response;
  do {
    response = await userClient.search({ from, size: 10 });
    for (let i = 0; i < response.hits.length; i++) {
      const user = response.hits[i];
      if ('current_store' in user && user.current_store) {
        try {
          await storeClient.get(user.current_store);
        } catch (error) {
          if (lodash.get(Error.cause(error), 'meta.statusCode') === 404) {
            console.log(
              `User id: ${user.id} first name: ${user.first_name} has a ghost store`,
            );
            // TODO: fix
          }
        }
      }
    }
    from += response.hits.length;
  } while (from < response.total);

  console.log('');
  console.log('Script finalized');
};

run();
