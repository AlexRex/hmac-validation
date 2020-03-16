import Router from 'koa-router';
import { simple, nonce, timestamp, complete } from './controllers';

export const router = new Router()
  .post('/simple', simple)
  .post('/timestamp', timestamp)
  .post('/complete', complete)
  .post('/nonce', nonce);
