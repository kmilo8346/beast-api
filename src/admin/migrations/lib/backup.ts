import fs from 'fs';
import util from 'util';
import Error from 'verror';

import logger from '../../../beast/logger';
import elastic from '../../../beast/clients/elastic';

const prefix = '[backup]';
const writeFile = util.promisify(fs.writeFile);

export default async (index: string, path: string) => {
  try {
    logger.info(`Making backup for index ${index}`);
    logger.info('');
    let from = 0;
    let total = 0;
    const data: any[] = [];
    do {
      const response = await elastic.search({
        index,
        body: {
          from,
          size: 50,
          sort: [{ updated_at: { order: 'desc' } }],
        },
      });
      from += response.body.hits.hits.length;
      total = response.body.hits.total.value;
      data.push(
        ...response.body.hits.hits.map((hit: any) => ({
          ...hit._source,
          id: hit._id,
        })),
      );
    } while (from < total);
    logger.info('Data downloaded ✓');

    const json = JSON.stringify(data);
    await writeFile(path, json, 'utf8');
    logger.info('Data persisted ✓');

    logger.info('');
    logger.info('Backup was completed 😍');
    logger.info(`Total of documents:    ${data.length}`);
  } catch (error) {
    throw new Error(
      { cause: error, info: { index, path } },
      `${prefix} Unexpected error in backup process`,
    );
  }
};
