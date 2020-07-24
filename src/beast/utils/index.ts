import lodash from 'lodash';

import { Product } from '../../types';
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

  public getStats(products: Product[]) {
    return products.reduce(
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

  public generateOrderId() {
    const random = `${Math.round(new Date().getTime() / 10)}${Math.floor(
      10 + Math.random() * 90,
    )}`;
    return `${random}`;
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
}

export default new Utils();
