import Error from 'verror';

import mercadopago from '../../../../beast/clients/mercadopago';
import { CreateParams } from '../../../../types';
import utils from '../../../../beast/utils';

const index = 'cards';
const prefix = '[card client]';

class CardClient {
  async create(
    params: CreateParams<{ customer_id: string; token: string }>,
  ): Promise<any> {
    try {
      const response = await mercadopago.customers.cards.create({
        id: params.body.customer_id,
        token: params.body.token,
      });

      return utils.mapObject(response.body, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Error creating card`,
      );
    }
  }
}

export default new CardClient();
