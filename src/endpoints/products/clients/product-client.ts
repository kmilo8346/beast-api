import Error from 'verror';

import {
  SearchParams,
  SearchResponse,
  Product,
  CreateParams,
  UpdateParams,
  CreateProduct,
} from '../../../types';
import utils from '../../../beast/utils';
import logger from '../../../beast/logger';
import pubsub from '../../../beast/clients/pubsub';
import elastic from '../../../beast/clients/elastic';

const prefix = '[product client]';
const index = 'products';

class ProductClient {
  /**
   * Get product
   * @param store string
   * @param product string
   * @param source string[]
   * @returns Promise<Product>
   */
  public async get(
    store: string,
    product: string,
    source?: string[],
  ): Promise<Product> {
    try {
      const response = await elastic.get({
        index,
        id: product,
        _source: source,
      });
      return {
        ...response.body._source,
        id: response.body._id,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { store, product, source } },
        `${prefix} Unexpected error getting product`,
      );
    }
  }

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
      const storeId = utils.parseId(store);

      // filters
      const bool: any = {
        must: [],
        filter: [],
        must_not: [],
      };
      if (storeId !== 'all') {
        bool.must.push({
          match_phrase: {
            'store.keyword': {
              query: storeId,
            },
          },
        });
      }

      if (params.filters) {
        if ('ids' in params.filters) {
          bool.must.push({
            bool: {
              should: (params.filters.ids as string[]).map((id: string) => ({
                match_phrase: {
                  _id: utils.parseId(id),
                },
              })),
              minimum_should_match: 1,
            },
          });
        }
        if ('enabled' in params.filters) {
          bool.must.push({
            match_phrase: {
              enabled: {
                query: params.filters.enabled,
              },
            },
          });
        }
        if ('reference' in params.filters) {
          bool.must.push({
            match_phrase: {
              'reference.keyword': {
                query: params.filters.reference,
              },
            },
          });
        }
        if ('must_not_id' in params.filters) {
          bool.must_not.push({
            match_phrase: {
              _id: {
                query: utils.parseId(params.filters.must_not_id),
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
        sort = Object.keys(params.sort).map((field) => ({
          [field]: { order: (params.sort as any)[field] },
        }));
      }

      const response = await elastic.search({
        index,
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
        hits: response.body.hits.hits.map(({ _source, _id }: any) => ({
          ..._source,
          id: _id,
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
   * @param store string
   * @param params CreateParams<CreateProduct>
   * @returns Promise<Product>
   */
  async create(
    store: string,
    params: CreateParams<CreateProduct>,
  ): Promise<Product> {
    try {
      const storeId = utils.parseId(store);

      // find already created product
      const searchResponse = await this.search(storeId, {
        filters: { reference: params.body.reference },
        from: 0,
        size: 1,
        source: params.source,
      });
      if (searchResponse.hits.length) {
        const alreadyCreated = searchResponse.hits[0] as Product;
        logger.info(
          `${prefix} A product is already created, product id ${alreadyCreated.id}, reference ${alreadyCreated.reference}`,
        );
        return alreadyCreated;
      }

      let newProduct: any = {
        ...params.body,
        store: storeId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newProduct,
      });
      newProduct = {
        ...newProduct,
        id: response.body._id,
      };

      // emit event
      await pubsub.publish('product.created', newProduct.id, newProduct);

      return utils.mapObject(newProduct, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { store, params } },
        `${prefix} Unexpected error creating product`,
      );
    }
  }

  /**
   * Update a product
   * @param store string
   * @param product string
   * @param params UpdateParams<Product>
   * @returns Promise<Partial<Product>>
   */
  async update(
    store: string,
    product: string,
    params: UpdateParams<Product>,
  ): Promise<Partial<Product>> {
    try {
      const id = utils.parseId(product);

      let update = {
        ...params.body,
        updated_at: new Date(),
      };
      await elastic.update({
        id,
        index,
        body: {
          doc: update,
        },
        refresh: 'true',
      });
      update = {
        ...update,
        id,
      };

      // emit event
      await pubsub.publish('product.updated', id, update);

      return utils.mapObject(update, params.source);
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
      const id = utils.parseId(product);

      await elastic.delete({
        index,
        id,
        refresh: 'true',
      });

      // emit event
      await pubsub.publish('product.deleted', id, { id });
    } catch (error) {
      throw new Error(
        { cause: error, info: { store, product } },
        `${prefix} Unexpected error deleting product`,
      );
    }
  }
}

export default new ProductClient();
