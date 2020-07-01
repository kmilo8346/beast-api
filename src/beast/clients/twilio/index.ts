import config from '../../config';

const twilio = require('twilio');

export default twilio(
  config.get('TWILIO_ACCOUNT_SID'),
  config.get('TWILIO_AUTH_TOKEN'),
);
