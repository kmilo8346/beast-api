// eslint-disable-next-line max-len
// npx ts-node -r dotenv-safe/config src/admin/show_orphan_stores.ts dotenv_config_path=${ENV_PATH} | npx pino-pretty --messageKey message --ignore pid,hostname,name

import Error from 'verror';
import lodash from 'lodash';

import userClient from '../endpoints/users/clients/user-client';
import storeClient from '../endpoints/stores/clients/store-client';
import productClient from '../endpoints/products/clients/product-client';
import { Store } from '../types';

// criterio tienda huerfana
// 1-no existe el user de la tienda
// 2-el user de esa tienda no tiene como current_store la tienda

const deleteStoreCascade = async (storeId: string) => {
  console.log('==== DELETING PRODUCTS OF STORE =====');

  let from = 0;
  const size = 10;
  let productsResp;

  do {
    productsResp = await productClient.search(storeId, { from, size });

    for (let index = 0; index < productsResp.hits.length; index++) {
      const prod = productsResp.hits[index];
      try {
        await productClient.delete(storeId, prod.id);
        console.log(`Deleting product: ${prod.id} Name: ${prod.name}`);
      } catch (error) {
        console.log(error);
      }
    }
    from += productsResp.hits.length;
  } while (from < productsResp.total);

  console.log('===== PRODUCTS OF STORE DELETED =====');
  console.log(' ');

  console.log('========== DELETING STORE ===========');
  await storeClient.delete(storeId);
  console.log('========== STORE  DELETED ===========');
  console.log('Las imagenes como las borro? -> Cloudinary');
};

const callbackForEachStore = async (store: Store, shouldFix: boolean) => {
  if ('user' in store && store.user) {
    try {
      const user = await userClient.get(store.user);
      // Este es el caso en el que la tienda tiene usuairo,
      // pero el usuario no esta asociado a la tienda
      if (user.current_store !== store.id) {
        console.log('=====================================');
        console.log('============= IS ORPHAN =============');
        console.log(`StoreID: ${store.id}`);
        console.log(`Name: ${store.name}`);
        console.log(`UserID: ${store.user}`);
        console.log('PROBLEM: store.id ≠ user.current_store');
        console.log(' ');

        if (!shouldFix) {
          console.log('Proposal: Delete the Store and its Products');
          console.log('======== DELETE THE STORE ===========');
          console.log('=====================================');
          console.log(' ');
        } else {
          await deleteStoreCascade(store.id);
        }
      }
    } catch (error) {
      if (lodash.get(Error.cause(error), 'meta.statusCode') === 404) {
        // Este es el caso donde la tienda tiene asociado un idusuario inexistente
        console.log('=====================================');
        console.log('============= IS ORPHAN =============');
        console.log(`StoreID: ${store.id}`);
        console.log(`Name: ${store.name}`);
        console.log(`Ghost UserID: ${store.user}`);
        console.log(`PROBLEM: User with id: ${store.user} doesn't exist`);
        console.log(' ');

        if (!shouldFix) {
          console.log('Proposal: Delete the Store and its Products');
          console.log('======== DELETE THE STORE ===========');
          console.log('=====================================');
          console.log(' ');
        } else {
          await deleteStoreCascade(store.id);
        }
      }
    }
  }
};

const run = async (fix: boolean) => {
  console.log(' ');
  console.log('*');
  console.log(`* Script started: FIXING: ${fix ? 'TRUE' : 'FALSE'}`);
  console.log('*');
  console.log(' ');

  let from = 0;
  const size = 10;
  let response;
  do {
    response = await storeClient.search({ from, size });

    for (let index = 0; index < response.hits.length; index++) {
      const store = response.hits[index];
      await callbackForEachStore(store, fix);
    }

    from += response.hits.length;
  } while (from < response.total);

  console.log('*');
  console.log('* Script ended');
  console.log('*');
};

// Ejecutar FIX
// run(true);
// Sin ejecutar FIX
run(false);
