import Error from 'verror';

import mercadopago from '../../../beast/clients/mercadopago';
import elastic from '../../../beast/clients/elastic';
import { CreateParams } from '../../../types';
import utils from '../../../beast/utils';

const index = 'cards';
const prefix = '[card client]';

interface Card {
  id: string;
  customer_id: string;
  mercadopago_customer_id: string;
  expiration_month: number;
  expiration_year: number;
  first_six_digits: string;
  last_four_digits: string;
  payment_method: {
    id: string;
    name: string;
    payment_type_id: string;
    thumbnail: string;
    secure_thumbnail: string;
  };
  security_code: {
    length: number;
    card_location: string;
  };
  issuer: {
    id: number;
    name: string;
  };
  cardholder: {
    name: string;
    identification: {
      number: string;
      type: string;
    };
  };
  live_mode: boolean;
  date_created: string;
  date_last_updated: string;
}

class CardClient {
  async create(
    customerId: string,
    params: CreateParams<{ mercadopago_customer_id: string; token: string }>,
  ): Promise<Card> {
    try {
      // add card to customer in mercado pago
      const response = await mercadopago.customers.cards.create({
        id: params.body.mercadopago_customer_id,
        token: params.body.token,
      });

      // index card in db
      const {
        date_created,
        date_last_updated,
        customer_id,
        ...card
      } = response.body;
      // change some values
      card.customer_id = customerId;
      card.mercadopago_customer_id = customer_id;
      card.created_at = new Date(date_created).toISOString();
      card.updated_at = new Date(date_last_updated).toISOString();
      await elastic.index({
        index,
        id: card.id,
        refresh: 'true',
        body: card,
      });

      return utils.mapObject(card, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { customerId, params } },
        `${prefix} Error creating card`,
      );
    }
  }

  async delete(customerId: string, cardId: string): Promise<any> {
    try {
      await elastic.delete({
        index,
        id: cardId,
        refresh: 'true',
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { customerId, cardId } },
        `${prefix} Error deleting`,
      );
    }
  }
}

export default new CardClient();
