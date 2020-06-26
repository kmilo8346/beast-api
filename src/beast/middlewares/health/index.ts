import Koa from 'koa';

import config from '../../config';
import info from '../../clients/info';

const formatTime = (seconds: number) => {
  const pad = (s: number) => (s < 10 ? '0' : '') + s;
  const hours = Math.floor(seconds / (60 * 60));
  const mins = Math.floor((seconds % (60 * 60)) / 60);
  const secs = Math.floor(seconds % 60);

  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
};

export default (options?: {
  labels: { [key: string]: any };
}): ((ctx: Koa.Context, next: () => Promise<any>) => Promise<any>) => async (
  ctx,
  next,
) => {
  if (ctx.path !== '/health') {
    await next();
    return;
  }

  const labels = {
    ...options?.labels,
  };
  const response = {
    name: info.name,
    version: info.version,
    environment: config.get('BEAST_ENVIRONMENT'),
    up_time: formatTime(process.uptime()),
    labels,
  };
  ctx.body = response;
};
