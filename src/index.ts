import { initServer, liftServer } from './beast';

const run = async () => {
  await initServer();
  liftServer();
};

run();
