import Error from 'verror';

import mercadopago from '../../../../beast/clients/mercadopago';
import { CreateParams } from '../../../../types';
import utils from '../../../../beast/utils';

const prefix = '[card token client]';
interface CardInfo {
  card_number: string;
  security_code: string;
  expiration_month: number;
  expiration_year: number;
  cardholder: {
    name: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

class CardClient {
  /**
   * Create a card token using mercado pago /card_tokens resource
   * @param params CreateParams<CardInfo>
   * @returns Promise<any>
   */
  async create(params: CreateParams<CardInfo>): Promise<any> {
    try {
      const response = await mercadopago.card_token.create(params.body);
      return utils.mapObject(response.body, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Error creating card token`,
      );
    }
  }
}

export default new CardClient();
