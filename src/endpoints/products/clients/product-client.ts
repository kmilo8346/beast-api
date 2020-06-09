import elastic from 'beast/clients/elastic';

const INDEX = 'products';

interface SearchParams {
  query: string;
  filters: {
    shopper_position: number[];
  };
  from: number;
  size: number;
  source: string[];
}

class ProductClient {
  async search(params: SearchParams) {
    try {
      const filter = {
        geo_shape: {
          'store.delivery_area': {
            shape: {
              type: 'Point',
              coordinates: params.filters.shopper_position,
            },
            relation: 'intersects',
          },
        },
      };

      const response = await elastic.search({
        index: INDEX,
        body: {
          query: {
            bool: {
              must: {
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
              },
              filter,
            },
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
      throw new Error('Error searching in elastic');
    }
  }
}

export default new ProductClient();
