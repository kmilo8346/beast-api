import path from 'path';

// eslint-disable-next-line import/no-dynamic-require
const packageJSON = require(path.join(process.cwd(), 'package.json'));

export default packageJSON;
