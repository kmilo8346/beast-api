import path from 'path';
import fs from 'fs';
import util from 'util';

// migration libs
import backup from './lib/backup';
// types
import { User } from '../../types';
// beast
import logger from '../../beast/logger';

const readFile = util.promisify(fs.readFile);

const run = async () => {
  try {
    const data_path = path.join(__dirname, 'tmp/users-duplicated-data.json');
    await backup('users', data_path);

    const raw = await readFile(data_path, 'utf8');
    const data = JSON.parse(raw) as User[];
    const hash: { [key: string]: User[] } = {};
    for (let i = 0; i < data.length; i++) {
      const user = data[i];
      if (user.phone) {
        if (user.phone in hash) {
          hash[user.phone] = [...hash[user.phone], user];
        } else {
          hash[user.phone] = [user];
        }
      }
    }
    Object.keys(hash).forEach((phone) => {
      if (hash[phone].length > 1) {
        logger.info(`${phone} as ${hash[phone].length} accounts`);
        logger.info(
          `Accounts: ${hash[phone].reduce(
            (text, user) => `${text}${user.id}, `,
            '',
          )}`,
        );
      }
    });
  } catch (error) {
    logger.error(
      { err: error },
      'Unexpected error in show duplicated accounts',
    );
  }
};

run();
