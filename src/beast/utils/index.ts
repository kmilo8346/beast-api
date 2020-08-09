import lodash from 'lodash';

import { Item } from '../../types';
import elastic from '../clients/elastic';

class Utils {
  public mapObject<T>(data: T, source: string[] | undefined): Partial<T> {
    if (!source) return data;

    const result: { [key: string]: any } = {};
    source.forEach((key) => {
      lodash.set(result, key, lodash.get(data, key));
    });
    return result as T;
  }

  public mapArray<T>(data: T[], source: string[] | undefined): Partial<T>[] {
    if (!source) return data;

    return data.map((d) => this.mapObject<T>(d, source));
  }

  public getStats(items: Item[]) {
    return items.reduce(
      (stats, product) => ({
        total: stats.total + 1,
        ammount: stats.ammount + product.price * 1,
      }),
      {
        total: 0,
        ammount: 0,
      },
    );
  }

  public async createIndexIfNotExist(index: string, body: any) {
    const response = await elastic.indices.exists({ index });
    if (!response.body) {
      await elastic.indices.create({
        index,
        body,
      });
    }
  }

  public generateId() {
    return `${Math.floor(1000 + Math.random() * 9000)}${new Date().valueOf()}`;
  }
}

export default new Utils();
