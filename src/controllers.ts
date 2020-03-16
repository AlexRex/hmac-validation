// tslint:disable: no-magic-numbers
import { Context, Middleware } from 'koa';
import { createHmac } from 'crypto';

const getSignatureHeader = (ctx: Context) => ctx.request.headers['x-hmac-signature'];
const SECRET_KEY = 'secret-hmac-key-you-know';

const okResponse = (ctx: Context) => {
  ctx.response.status = 200;

  return ctx;
};

const badResponse = (ctx: Context) => {
  ctx.response.status = 403;

  return ctx;
};

const testHash = (created: string, original: string, ctx: Context) =>
  created === original
    ? okResponse(ctx)
    : badResponse(ctx);

const parseSignature = (rawSignature: string) => {
  const [ signature, nonce, timestamp ] = rawSignature.split(':');

  return {
    signature, signatureNonce: nonce, signatureTimestamp: Number(timestamp)
  };
};

export const simple: Middleware = async (ctx: Context, next) => {
  const stringBody = JSON.stringify(ctx.request.body);

  const hash = createHmac('sha256', SECRET_KEY)
    .update(stringBody)
    .digest('base64');

  return testHash(hash, getSignatureHeader(ctx), ctx);
};

// This must be a Redis, Memcached or similar.
// And in order to reduce the size and collision issues a TTL to the elemtns should be added.
const nonceSet = new Set();
export const nonce: Middleware = async (ctx: Context) => {
  const { signatureNonce } = parseSignature(getSignatureHeader(ctx));

  const bodyNonce = ctx.request.body.nonce;

  if (signatureNonce !== bodyNonce || nonceSet.has(signatureNonce)) {
    return badResponse(ctx);
  }

  nonceSet.add(signatureNonce);

  const stringBody = JSON.stringify(ctx.request.body);

  const hash = createHmac('sha256', SECRET_KEY)
    .update(stringBody)
    .digest('base64');

  return testHash(`${hash}:${bodyNonce}`, getSignatureHeader(ctx), ctx);
};

export const timestamp: Middleware = async (ctx: Context) => {
  const { signatureTimestamp, signatureNonce } = parseSignature(getSignatureHeader(ctx));

  const bodyTimestamp = ctx.request.body.requestTimestamp;

  const timeDifference = Math.abs(new Date().getTime() - bodyTimestamp);

  if (signatureTimestamp !== bodyTimestamp || timeDifference > 10000) { // Bigger than 10 secs for drift ?
    return badResponse(ctx);
  }

  const stringBody = JSON.stringify(ctx.request.body);

  const hash = createHmac('sha256', SECRET_KEY)
    .update(stringBody)
    .digest('base64');

  return testHash(`${hash}:${signatureNonce}:${bodyTimestamp}`, getSignatureHeader(ctx), ctx);
};

// Complete solution: Simple + Nonce + Timestamp
export const complete: Middleware = async (ctx: Context) => {
  const { signatureTimestamp, signatureNonce } = parseSignature(getSignatureHeader(ctx));

  const bodyTimestamp = ctx.request.body.requestTimestamp;
  const bodyNonce = ctx.request.body.nonce;

  const timeDifference = Math.abs(new Date().getTime() - bodyTimestamp);

  // Bigger than 10 secs for drift ?
  if (signatureTimestamp !== bodyTimestamp || timeDifference > 10000) {
    return badResponse(ctx);
  }

  if (signatureNonce !== bodyNonce || nonceSet.has(signatureNonce)) {
    return badResponse(ctx);
  }

  nonceSet.add(signatureNonce);

  const stringBody = JSON.stringify(ctx.request.body);

  const hash = createHmac('sha256', SECRET_KEY)
    .update(stringBody)
    .digest('base64');

  return testHash(`${hash}:${bodyNonce}:${bodyTimestamp}`, getSignatureHeader(ctx), ctx);
};
