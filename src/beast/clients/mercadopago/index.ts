// @ts-ignore
import mercadopago from 'mercadopago';

import config from '../../config';

mercadopago.configure({
  sandbox: false,
  access_token: config.get('MERCADO_PAGO_ACCESS_TOKEN'),
});

export default mercadopago;
