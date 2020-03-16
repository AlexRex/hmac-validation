import Koa from 'koa';
import Router from 'koa-router';

import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';

/**
 * Creates a new server in the specified port
 *
 * @param router Router instance
 * @param port Port instance
 *
 * @returns Koa server instance
 */
export const startServer = (router: Router, port: number) =>
  new Koa()
    .use(json())
    .use(logger())
    .use(bodyParser())
    .use(cors())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(port, () =>
      console.log(`Koa server listening on PORT ${port}`)
    );
