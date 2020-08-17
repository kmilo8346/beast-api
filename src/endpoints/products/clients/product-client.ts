import Error from 'verror';

import elastic from '../../../beast/clients/elastic';
import {
  SearchParams,
  SearchResponse,
  Product,
  CreateParams,
  UpdateParams,
  CreateProduct,
} from '../../../types';
import utils from '../../../beast/utils';

const prefix = '[product client]';

class ProductClient {
  /**
   * Search products
   * @param store string
   * @param params SearchParams
   * @returns Promise<SearchResponse<Product>
   */
  async search(
    store: string,
    params: SearchParams,
  ): Promise<SearchResponse<Product>> {
    try {
      // filters
      const bool: any = {
        must: [
          {
            match_phrase: {
              'store.keyword': {
                query: store,
              },
            },
          },
        ],
        filter: [],
      };
      if (params.query) {
        bool.filter.push({
          multi_match: {
            query: params.query,
            fields: ['name^3', 'description^3', 'brand^2', 'tags^1.5'],
            fuzziness: 'AUTO',
            prefix_length: 2,
          },
        });
      }
      if (params.filters) {
        if ('enabled' in params.filters) {
          bool.must.push({
            match_phrase: {
              enabled: {
                query: params.filters.enabled,
              },
            },
          });
        }
      }

      // sort
      let sort: { [key: string]: { order: 'desc' | 'asc' } }[] = [
        { updated_at: { order: 'desc' } },
      ];
      if (params.sort) {
        sort = params.sort.map((s) => ({ [s.field]: { order: s.order } }));
      }

      const response = await elastic.search({
        index: 'products*',
        body: {
          query: {
            bool,
          },
          sort,
          from: params.from,
          size: params.size,
          _source: params.source,
        },
      });

      return {
        from: params.from,
        size: params.size,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: `${_index}|${_id}`,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching products`,
      );
    }
  }

  /**
   * Create a product
   * @param stors string
   * @param params CreateParams<CreateProduct>
   * @returns Promise<Product>
   */
  async create(
    store: string,
    params: CreateParams<CreateProduct>,
  ): Promise<Product> {
    try {
      // create index if not exist
      const index = 'products';
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      });

      const newProduct = {
        store,
        ...params.body,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newProduct,
      });
      return utils.mapObject(
        {
          ...newProduct,
          id: `${response.body._index}|${response.body._id}`,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating product`,
      );
    }
  }

  /**
   * Update a product
   * @param store: string
   * @param product: string
   * @param params UpdateParams<Product>
   * @returns Promise<void>
   */
  async update(
    store: string,
    product: string,
    params: UpdateParams<Product>,
  ): Promise<void> {
    try {
      const [_index, _id] = product.split('|');
      await elastic.update({
        index: _index,
        id: _id,
        body: {
          doc: {
            store,
            ...params.body,
            updated_at: new Date(),
          },
        },
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { store, product, params } },
        `${prefix} Unexpected error updating product`,
      );
    }
  }

  /**
   * Delete product
   * @param store string
   * @param product string
   * @returns Promise<void>
   */
  async delete(store: string, product: string): Promise<void> {
    try {
      const [_index, _id] = product.split('|');
      await elastic.delete({
        index: _index,
        id: _id,
        refresh: 'true',
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { store, product } },
        `${prefix} Unexpected error deleting product`,
      );
    }
  }
}

export default new ProductClient();
