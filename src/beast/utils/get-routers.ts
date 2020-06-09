import fs from 'fs';
import path from 'path';
import Router from 'koa-router';

interface Route {
  method: string,
  path: string,
  
}

const getRouters = (dir: string) => {
  let routers = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      routers = routers.concat(getRouters(fullPath));
    } else if (file === 'router.json') {
        const routerConfig = 
      const routeFiles = fs.readdirSync(path.join(dir, 'routes'));
      const routes = [];
      routeFiles.forEach((routeFile) => {
        try {
          const route = require(path.join(dir, routes, routeFile));
          routes.push(route);
        } catch (error) {}
      });
      new Router()
    }
  });
  return routers;
};
