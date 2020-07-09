import Error from 'verror';

import elastic from '../elastic';

const prefix = '[operation record client]';
const index = 'operation-record';
interface CreateOperationRecordParams {
  type: 'MERCADO_PAGO_SIGN_IN';
  meta_data: { [key: string]: any };
}

class OperationRecordClient {
  /**
   * Creta a operation record
   * @param params
   */
  async create(params: CreateOperationRecordParams): Promise<any> {
    try {
      const expires_in = new Date();
      expires_in.setTime(expires_in.getTime() + 1 * 60 * 60 * 1000);

      const response = await elastic.index({
        index,
        body: {
          ...params,
          expires_in,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return { id: response.body._id };
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Error creating operation record`,
      );
    }
  }
}

export default new OperationRecordClient();
