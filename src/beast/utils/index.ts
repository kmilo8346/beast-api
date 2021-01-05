import lodash from 'lodash';

import { AddressProp, Item, Place } from '../../types';
import elastic from '../clients/elastic';

class Utils {
  public mapObject<T>(data: T, source: string[] | undefined): T {
    if (!source) return data;
    const s = [...source, 'id'];

    const result: { [key: string]: any } = {};
    s.forEach((key) => {
      lodash.set(result, key, lodash.get(data, key));
    });
    return result as T;
  }

  public mapArray<T>(data: T[], source: string[] | undefined): T[] {
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

  public mapPlace(data: any): Place {
    const types = [
      'street_number',
      'route',
      'locality',
      'administrative_area_level_3',
      'administrative_area_level_2',
      'administrative_area_level_1',
    ];
    const addressComponents: { [key: string]: AddressProp } = {};
    data.address_components.forEach(
      (component: {
        short_name: string;
        long_name: string;
        types: string[];
      }) => {
        component.types.forEach((type) => {
          const match = types.find((t) => t === type);
          if (match) {
            addressComponents[type] = {
              short_name: component.short_name,
              long_name: component.long_name,
            };
          }
        });
      },
    );
    // sometimes locality is not returned
    if (!('locality' in addressComponents)) {
      addressComponents.locality =
        addressComponents.administrative_area_level_3;
    }
    const place = {
      id: data.place_id,
      street_number: addressComponents.street_number,
      route: addressComponents.route,
      locality: addressComponents.locality,
      administrative_area_level_3:
        addressComponents.administrative_area_level_3,
      administrative_area_level_2:
        addressComponents.administrative_area_level_2,
      administrative_area_level_1:
        addressComponents.administrative_area_level_1,
      apartment: '',
      location: {
        lat: data.geometry.location.lat,
        lon: data.geometry.location.lng,
      },
      formatted_address: data.formatted_address,
      url: data.url,
    };
    return place;
  }

  public convertNameToSlug(name: string) {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  public sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public parseId(id: string) {
    const parts = id.split('|');
    return parts.length > 1 ? parts[1] : id;
  }
}

export default new Utils();
