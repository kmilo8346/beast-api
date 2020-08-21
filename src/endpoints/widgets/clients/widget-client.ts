import Error from 'verror';

import utils from '../../../beast/utils';
import elastic from '../../../beast/clients/elastic';
import {
  CreateParams,
  CreateWidget,
  Widget,
  UpdateParams,
  SearchParams,
  SearchResponse,
  Location,
  ComputedWidget,
  BannerInstructions,
  BannerContent,
  NearbyStoresInstructions,
  WidgetType,
  NearbyStoresContent,
  ComputeParams,
  ComputeResponse,
  ComputeContext,
} from '../../../types';
import storeClient from '../../stores/clients/store-client';

const prefix = '[widget client]';

/**
 * @class WidgetClient
 */
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
      };
      if (params.filters) {
        if ('tag' in params.filters) {
          bool.filter.push({
            match_phrase: {
              tags: params.filters.tag,
            },
          });
        }
      }

      // sort
      let sort: { [key: string]: { order: 'desc' | 'asc' } }[] = [
        { sort: { order: 'asc' } },
      ];
      if (params.sort) {
        sort = params.sort.map((s) => ({ [s.field]: { order: s.order } }));
      }

      const response = await elastic.search({
        index: 'widgets*',
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
        query: params.query,
        filters: params.filters,
        from: params.from,
        size: params.size,
        sort: params.sort,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: `${_index}|${_id}`,
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
   * Create widget
   * @param params CreateParams<CreateWidget>
   * @returns Promise<Widget>
   */
  public async create(params: CreateParams<CreateWidget>): Promise<Widget> {
    try {
      // create index if not exist
      const index = 'widgets';
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            opening_hours: { type: 'nested' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      });

      const newWidget = {
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
          id: `${response.body._index}|${response.body._id}`,
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
   * @param id: string
   * @param params UpdateParams<Widget>
   * @returns Promise<void>
   */
  async update(id: string, params: UpdateParams<Widget>): Promise<void> {
    try {
      const [_index, _id] = id.split('|');
      await elastic.update({
        index: _index,
        id: _id,
        body: {
          doc: {
            ...params.body,
            updated_at: new Date(),
          },
        },
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
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
      const [_index, _id] = id.split('|');
      await elastic.delete({
        index: _index,
        id: _id,
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
   * Compute widgets
   * @param params ComputeParams
   * @returns Promise<ComputeResponse>
   */
  async compute(params: ComputeParams): Promise<ComputeResponse> {
    try {
      const widgets = await this.search({
        filters: params.filters,
        from: params.from,
        size: params.size,
      });
      const computedWidgets = await Promise.all(
        widgets.hits.map((widget) =>
          this.computeWidget(widget, params.context),
        ),
      );
      return {
        filters: params.filters,
        from: widgets.from,
        size: widgets.size,
        total: widgets.total,
        hits: computedWidgets,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: {} },
        `${prefix} Unexpected error computing widgets`,
      );
    }
  }

  private async computeWidget(
    widget: Widget,
    context: ComputeContext,
  ): Promise<ComputedWidget> {
    let computedWidget: ComputedWidget | null = null;
    if (widget.type === WidgetType.BANNER) {
      const bannerInstructions = widget.instructions as BannerInstructions;
      computedWidget = {
        id: widget.id,
        type: widget.type,
        content: {
          image: bannerInstructions.image,
        },
      };
    } else if (widget.type === WidgetType.NEARBY_STORES) {
      const nearbyStoresInstructions = widget.instructions as NearbyStoresInstructions;
      const stores = await storeClient.search({
        filters: {
          location: context.location,
        },
        from: nearbyStoresInstructions.from,
        size: nearbyStoresInstructions.size,
      });
      computedWidget = {
        id: widget.id,
        type: widget.type,
        content: {
          title: nearbyStoresInstructions.title,
          initial: stores,
        },
      };
    }
    if (!computedWidget) {
      throw new Error(
        { info: { widget, context } },
        `${prefix} Unexpected error computing widget`,
      );
    }
    return computedWidget;
  }
}

export default new WidgetClient();
