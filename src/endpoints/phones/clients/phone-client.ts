import Error from 'verror';

import twilioClient from '../../../beast/clients/twilio';
import config from '../../../beast/config';

const prefix = '[phone client]';

class PhoneClient {
  /**
   * Generate a code send to a phone using twilio servicio
   * @param data
   */
  async code(data: { phone: string }): Promise<any> {
    try {
      const code = `${Math.floor(1000 + Math.random() * 9000)}`;
      await twilioClient.messages.create({
        to: data.phone,
        from: config.get('TWILIO_PHONE'),
        body: `Código de Shop-Shop: ${code}`,
      });
      return {
        code,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { data } },
        `${prefix} Error generating phone otp code`,
      );
    }
  }
}

export default new PhoneClient();
