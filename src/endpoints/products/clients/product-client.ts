import Error from 'verror';

import elastic from '../../../beast/clients/elastic';
import {
  SearchParams,
  SearchResponse,
  Product,
  CreateParams,
  Service,
} from '../../../types';
import utils from '../../../beast/utils';

const index = 'products-*';
const prefix = '[product client]';

class ProductClient {
  /**
   * Search over products index
   * @param params
   */
  async search(storeId: string, params: SearchParams): Promise<SearchResponse> {
    try {
      const bool: { [key: string]: any } = {};
      if (params.query) {
        bool.must = {
          multi_match: {
            query: params.query,
            fields: [
              'name^2',
              'description',
              'categories',
              'tags',
              'store.name',
            ],
          },
        };
      }

      bool.filter = [];
      if (storeId !== '-') {
        bool.filter.push({
          term: {
            'store.id': storeId,
          },
        });
      }
      if (params.filters) {
        if (params.filters.position) {
          bool.filter.push({
            geo_shape: {
              'store.delivery_area.geometry': {
                shape: {
                  type: 'Point',
                  coordinates: params.filters.position,
                },
                relation: 'intersects',
              },
            },
          });
        }
      }

      const response = await elastic.search({
        index,
        body: {
          query: {
            bool,
          },
          from: params.from,
          size: params.size,
          _source: params.source,
          sort: [{ 'store.name.keyword': { order: 'asc' } }],
        },
      });

      return {
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _id, _source }: any) => ({
          id: _id,
          ..._source,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Error searching over products index`,
      );
    }
  }

  /**
   * Create a product
   * @param params
   */
  async create(
    storeId: string,
    params: CreateParams<Product | Service>,
  ): Promise<any> {
    try {
      const newProduct = {
        ...params.body,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index: `products-${storeId}`,
        refresh: 'true',
        body: newProduct,
      });
      return utils.mapObject(
        {
          ...newProduct,
          id: response.body._id,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        'Error creating product',
      );
    }
  }

  /**
   * Update a product
   * @param params
   */
  async update(
    storeId: string,
    productId: string,
    product: Product | Service,
  ): Promise<void> {
    try {
      await elastic.update({
        index: `products-${storeId}`,
        id: productId,
        body: {
          doc: {
            ...product,
            updated_at: new Date(),
          },
        },
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { storeId, productId, product } },
        'Error updating product',
      );
    }
  }
}

export default new ProductClient();
