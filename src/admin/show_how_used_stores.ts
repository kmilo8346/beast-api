// eslint-disable-next-line max-len
// npx ts-node -r dotenv-safe/config src/admin/show_how_used_stores.ts dotenv_config_path=${ENV_PATH} | npx pino-pretty --messageKey message --ignore pid,hostname,name

import moment from 'moment';

import { Store } from '../types';
import storeClient from '../endpoints/stores/clients/store-client';
import productClient from '../endpoints/products/clients/product-client';

const isAllWeekClosed = (store: Store) =>
  store.opening_hours.every((oh) => !oh.hours.length);

const run = async () => {
  console.log('Script started');
  console.log('');
  console.log('Analizing stores');

  let from = 0;
  let response;
  const stores: Store[] = [];
  do {
    response = await storeClient.search({
      from,
      size: 10,
      source: ['id', 'name', 'opening_hours', 'updated_at'],
    });
    stores.push(...response.hits);
    from += response.hits.length;
  } while (from < response.total);

  const data: {
    all_week_closed: { count: number; stores: Store[] };
    whithout_products: { count: number; stores: Store[] };
    last_update_more_than_a_month_ago: { count: number; stores: Store[] };
  } = {
    all_week_closed: { count: 0, stores: [] },
    whithout_products: { count: 0, stores: [] },
    last_update_more_than_a_month_ago: { count: 0, stores: [] },
  };
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    if (isAllWeekClosed(store)) {
      data.all_week_closed.count++;
      data.all_week_closed.stores.push(store);
    }
    if (moment().subtract(30, 'd').isAfter(moment(store.updated_at))) {
      data.last_update_more_than_a_month_ago.count++;
      data.last_update_more_than_a_month_ago.stores.push(store);
    }
    const r = await productClient.search(store.id, {
      from: 0,
      size: 1,
      source: ['id'],
    });
    if (r.hits.length === 0) {
      data.whithout_products.count++;
      data.whithout_products.stores.push(store);
    }
  }

  console.log('Analizing results');
  console.log('');
  if (data.all_week_closed.count > 0) {
    console.log(
      `Tiendas toda la semana cerrada: ${data.all_week_closed.count}`,
    );
    console.log('Tiendas:');
    for (let i = 0; i < data.all_week_closed.stores.length; i++) {
      const s = data.all_week_closed.stores[i];
      console.log(s.name);
    }
    console.log('');
  }

  if (data.whithout_products.count > 0) {
    console.log(`Tiendas sin productos: ${data.whithout_products.count}`);
    console.log('Tiendas:');
    for (let i = 0; i < data.whithout_products.stores.length; i++) {
      const s = data.whithout_products.stores[i];
      console.log(s.name);
    }
    console.log('');
  }

  if (data.last_update_more_than_a_month_ago.count > 0) {
    console.log(
      `Tiendas que su ultima actualización fue hace mas de un mes: ${data.last_update_more_than_a_month_ago.count}`,
    );
    console.log('Tiendas:');
    for (
      let i = 0;
      i < data.last_update_more_than_a_month_ago.stores.length;
      i++
    ) {
      const s = data.last_update_more_than_a_month_ago.stores[i];
      console.log(s.name);
    }
    console.log('');
  }

  console.log('Script finalized');
};

run();
