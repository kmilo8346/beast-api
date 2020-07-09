import Error from 'verror';

import config from '../../../../beast/config';
import { CreateParams } from '../../../../types';
import opertationRecordClient from '../../../../beast/clients/operation-record';

const prefix = '[authorization client]';
interface GenerateSaveUrl {
  user_id: string;
}

class AuthorizationClient {
  /**
   * Generate a save mercado pago authorization save url
   * To provide security the user is saved in a operation record
   * An operation record expire in one hour
   * @param params
   * @return Promise<any>
   */
  async generateSafeURL(params: CreateParams<GenerateSaveUrl>): Promise<any> {
    try {
      const operationRecord = await opertationRecordClient.create({
        type: 'MERCADO_PAGO_SIGN_IN',
        meta_data: {
          user_id: params.body.user_id,
        },
      });
      return {
        safe_url: `${config.get(
          'MERCADO_PAGO_AUTH_URL',
        )}/authorization?client_id=${config.get(
          'MERCADO_PAGO_APP_ID',
        )}&response_type=code&platform_id=mp&state=${`${
          operationRecord.id
        }|${config.get('BEAST_ENVIRONMENT')}`}&redirect_uri=${config.get(
          'MERCADO_PAGO_REDIRECT',
        )}`,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Error generating safe url`,
      );
    }
  }
}

export default new AuthorizationClient();
