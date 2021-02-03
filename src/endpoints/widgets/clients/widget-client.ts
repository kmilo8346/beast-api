import Error from 'verror';
import lodash from 'lodash';
import moment from 'moment';

import {
  SearchParams,
  SearchResponse,
  CreateParams,
  UpdateParams,
  Widget,
  CreateWidget,
  RenderedWidget,
  WidgetType,
  StoreHorizontalListWidget,
  StoreVerticalListWidget,
  ProductHorizontalListWidget,
} from '../../../types';
import utils from '../../../beast/utils';
import elastic from '../../../beast/clients/elastic';
import storeProductClient from '../../store-products/clients/store-product-client';

const prefix = '[widget client]';
const index = 'widgets';

interface RenderParams extends SearchParams {
  context: { [key: string]: any };
}

class WidgetClient {
  /**
   * Search widgets
   * @param params SearchParams
   * @returns Promise<SearchResponse<Widget>
   */
  async search(params: SearchParams): Promise<SearchResponse<Widget>> {
    try {
      // filters
      const bool: any = {
        must: [],
        filter: [],
        must_not: [],
      };

      if (params.filters) {
        if ('tags' in params.filters) {
          bool.must.push({
            bool: {
              should: params.filters.tags.map((tag: string) => ({
                match_phrase: {
                  'tags.keyword': tag,
                },
              })),
              minimum_should_match: 1,
            },
          });
        }
      }

      // mapping sort
      let sort: { [key: string]: { order: 'desc' | 'asc' } }[] | undefined;
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
        `${prefix} Unexpected error searching widgets`,
      );
    }
  }

  /**
   * Create a widget
   * @param params CreateParams<CreateWidget>
   * @returns Promise<Widget>
   */
  async create(params: CreateParams<CreateWidget>): Promise<Widget> {
    try {
      const newWidget: any = {
        ...params.body,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newWidget,
      });

      return utils.mapObject(
        {
          ...newWidget,
          id: response.body._id,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating widget`,
      );
    }
  }

  /**
   * Update widget
   * @param id string
   * @param params UpdateParams<Widget>
   * @returns Promise<Partial<Widget>>
   */
  async update(
    id: string,
    params: UpdateParams<Widget>,
  ): Promise<Partial<Widget>> {
    try {
      const update = {
        ...params.body,
        updated_at: new Date(),
      };
      await elastic.update({
        id,
        index,
        body: {
          doc: update,
        },
      });

      return utils.mapObject(
        {
          ...update,
          id,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error updating widget`,
      );
    }
  }

  /**
   * Delete widget
   * @param id string
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    try {
      await elastic.delete({
        index,
        id,
        refresh: 'true',
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { id } },
        `${prefix} Unexpected error deleting widget`,
      );
    }
  }

  /**
   * Render widgets
   * @param params RenderParams
   * @returns Promise<SearchResponse<RenderedWidget>
   */
  async render(params: RenderParams): Promise<SearchResponse<RenderedWidget>> {
    try {
      const response = await this.search(params);
      const promises: Promise<RenderedWidget | null>[] = [];
      response.hits.forEach((widget) => {
        promises.push(this.renderWidget(widget, params.context));
      });
      let renderedWidgets = await Promise.all(promises);
      renderedWidgets = renderedWidgets.filter((i) => {
        if (!i) {
          response.total--;
        }
        return !!i;
      });
      return {
        ...response,
        hits: renderedWidgets as RenderedWidget[],
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error rendering widgets`,
      );
    }
  }

  private async renderWidget(
    widget: Widget,
    context: { [key: string]: any },
  ): Promise<RenderedWidget | null> {
    if (widget.type === WidgetType.STORE_HORIZONTAL_LIST) {
      const storeHorizontalListWidget = widget as StoreHorizontalListWidget;
      const searchParams = {
        ...storeHorizontalListWidget.instructions.search,
      };
      searchParams.filters = searchParams.filters || {};
      searchParams.filters = this.processFilters(searchParams.filters, context);
      const response = await storeProductClient.search(searchParams);
      // no content
      if (response.total === 0) {
        return null;
      }

      return {
        id: widget.id,
        type: widget.type,
        data: { title: storeHorizontalListWidget.instructions.title, response },
      };
    }
    if (widget.type === WidgetType.STORE_VERTICAL_LIST) {
      const storeVerticalListWidget = widget as StoreVerticalListWidget;
      const searchParams = {
        ...storeVerticalListWidget.instructions.search,
      };
      searchParams.filters = searchParams.filters || {};
      searchParams.filters = this.processFilters(searchParams.filters, context);
      const response = await storeProductClient.search(searchParams);
      // no content
      if (response.total === 0) {
        return null;
      }

      return {
        id: widget.id,
        type: widget.type,
        data: { response },
      };
    }
    if (widget.type === WidgetType.PRODUCT_HORIZONTAL_LIST) {
      const productHorizontalListWidget = widget as ProductHorizontalListWidget;
      const searchParams = {
        ...productHorizontalListWidget.instructions.search,
      };
      searchParams.filters = searchParams.filters || {};
      searchParams.filters = this.processFilters(searchParams.filters, context);
      const response = await storeProductClient.search(searchParams);
      // no content
      if (
        response.total < productHorizontalListWidget.instructions.min_allowed
      ) {
        return null;
      }

      return {
        id: widget.id,
        type: widget.type,
        data: {
          title: productHorizontalListWidget.instructions.title,
          response,
        },
      };
    }
    throw new Error(`Not mapped widget, type: ${widget.type}`);
  }

  private processFilters(
    filters: { [key: string]: any },
    context: { [key: string]: any },
  ) {
    const processed = { ...filters };
    Object.keys(processed).forEach((key) => {
      if (typeof processed[key] === 'object' && processed[key] !== null) {
        processed[key] = this.processFilters(processed[key], context);
      } else if (typeof processed[key] === 'string') {
        if (processed[key].startsWith('@context')) {
          processed[key] = lodash.get(context, processed[key].split('|')[1]);
        } else if (processed[key].startsWith('@date-substract-days')) {
          processed.store_created_at_gte = moment()
            .subtract(Number(processed[key].split('|')[1]), 'd')
            .toISOString();
        }
      }
    });
    return processed;
  }
}

export default new WidgetClient();
