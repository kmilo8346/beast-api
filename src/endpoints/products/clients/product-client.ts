import Error from 'verror';

import elastic from '../../../beast/clients/elastic';
import {
  SearchParams,
  UpdateParams,
  SearchResponse,
  Product,
  CreateResponse,
  UpdateResponse,
  CreateParams,
} from '../../../types';

const index = 'products-*';

class ProductClient {
  /**
   * Search over products index
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse> {
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
      if (params.filters) {
        bool.filter = [];
        if (params.filters.position) {
          bool.filter.push({
            geo_shape: {
              'store.delivery_area': {
                shape: {
                  type: 'Point',
                  coordinates: params.filters.position,
                },
                relation: 'intersects',
              },
            },
          });
        }
        if (params.filters.store) {
          bool.filter.push({
            term: {
              'store.name.keyword': params.filters.store,
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
        'Error searching over products index',
      );
    }
  }

  /**
   * Create a product
   * @param params
   */
  async create(params: CreateParams<Product>): Promise<CreateResponse> {
    try {
      const { body, statusCode } = await elastic.index({
        index: `products-${params.body.store.id}`,
        body: {
          ...params.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        id: body._id,
        result: body.result,
        statusCode,
      };
    } catch (error) {
      throw new Error({ cause: error, info: params }, 'Error creating product');
    }
  }

  /**
   * Update a product
   * @param params
   */
  async update(params: UpdateParams<Product>): Promise<UpdateResponse> {
    try {
      const { body, statusCode } = await elastic.update({
        index: `products-${params.body.store?.id}`,
        id: params.id,
        body: {
          doc: params.body,
        },
      });
      return {
        id: body._id,
        result: body.result,
        statusCode,
      };
    } catch (error) {
      if (error.meta.statusCode === 404) {
        throw new Error(
          { cause: error, name: 'Not Found', info: params },
          'Product Not Found',
        );
      } else {
        throw new Error(
          { cause: error, info: params },
          'Error updating product',
        );
      }
    }
  }
}

export default new ProductClient();
