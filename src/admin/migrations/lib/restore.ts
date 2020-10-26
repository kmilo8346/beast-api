import fs from 'fs';
import util from 'util';
import lodash from 'lodash';
import Error from 'verror';

import logger from '../../../beast/logger';
import utils from '../../../beast/utils';
import elastic from '../../../beast/clients/elastic';

const readFile = util.promisify(fs.readFile);

export default async <T>(
  index: string,
  path: string,
  map = (array: T[]) => array,
  mapping: any,
) => {
  try {
    logger.info(`Restoring index ${index}`);
    logger.info('');

    const raw = await readFile(path, 'utf8');
    const data = JSON.parse(raw);
    logger.info('Data loaded ✓');

    const mapped = map(data);
    logger.info('Data mapped ✓');

    await elastic.indices.delete({ index });
    logger.info('Index deleted ✓');

    await utils.createIndexIfNotExist(index, mapping);
    logger.info('Index created ✓');

    const chunks = lodash.chunk(
      lodash.flatMap(mapped, (document: any) => {
        const { id, ...doc } = document;
        return [{ index: { _index: index, _id: id } }, { ...doc }];
      }),
      50,
    );
    const errors: any[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const payload = chunks[i];
      const { body: response } = await elastic.bulk({
        refresh: 'true',
        body: payload,
      });
      if (response.errors) {
        response.items.forEach((action: any, j: number) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            errors.push({
              status: action[operation].status,
              error: action[operation].error,
              operation: payload[j * 2],
              document: payload[j * 2 + 1],
            });
          }
        });
      }
    }
    logger.info('Data inserted ✓');

    logger.info('');
    if (!errors.length) {
      logger.info('Restore was completed 😍');
      logger.info(`Total of documents :    ${data.length}`);
    } else {
      logger.info(`${index} index could not be fully restored 😤`);
      logger.info(`Error details      :    ${JSON.stringify(errors)}`);
    }
  } catch (error) {
    throw new Error(
      { cause: error, info: { index, path } },
      'Unexpected error in restore process',
    );
  }
};
