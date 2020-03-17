// tslint:disable: no-magic-numbers
import { Context, Middleware } from 'koa';
import { createHmac } from 'crypto';

const getSignatureHeader = (ctx: Context) => ctx.request.headers['x-hmac-signature'];
const SECRET_KEY = 'secret-hmac-key-you-know';

const okResponse = (ctx: Context) => {
  ctx.response.status = 200;

  return ctx;
};

const badResponse = (ctx: Context, message: string) => {
  ctx.response.status = 403;
  ctx.response.body = message;

  return ctx;
};

const testHash = (created: string, original: string, ctx: Context, message: string) =>
  created === original
    ? okResponse(ctx)
    : badResponse(ctx, message);

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

  return testHash(hash, getSignatureHeader(ctx), ctx, 'Failed to compare hmac');
};

// This must be a Redis, Memcached or similar.
// And in order to reduce the size and collision issues a TTL to the elemtns should be added.
const nonceSet = new Set();
export const nonce: Middleware = async (ctx: Context) => {
  const { signatureNonce } = parseSignature(getSignatureHeader(ctx));

  if (nonceSet.has(signatureNonce)) {
    return badResponse(ctx, 'Nonce already exists');
  }

  nonceSet.add(signatureNonce);

  const stringBody = JSON.stringify(ctx.request.body);

  const toHash = `${stringBody}${signatureNonce}`;

  const hash = createHmac('sha256', SECRET_KEY)
    .update(toHash)
    .digest('base64');

  return testHash(`${hash}:${signatureNonce}`, getSignatureHeader(ctx), ctx, 'Failed to compare hmac');
};

export const timestamp: Middleware = async (ctx: Context) => {
  const { signatureTimestamp, signatureNonce } = parseSignature(getSignatureHeader(ctx));

  const timeDifference = Math.abs(new Date().getTime() - signatureTimestamp);

  if (timeDifference > 10000) { // Bigger than 10 secs for drift ?
    return badResponse(ctx, `Time difference is ${timeDifference}`);
  }

  const stringBody = JSON.stringify(ctx.request.body);

  const toHash = `${stringBody}${signatureTimestamp}`;

  const hash = createHmac('sha256', SECRET_KEY)
    .update(toHash)
    .digest('base64');

  // Using dummy nonce
  return testHash(
    `${hash}:${signatureNonce}:${signatureTimestamp}`, getSignatureHeader(ctx), ctx, 'Failed to compare hmac'
  );
};

// Complete solution: Simple + Nonce + Timestamp
export const complete: Middleware = async (ctx: Context) => {
  const { signatureTimestamp, signatureNonce } = parseSignature(getSignatureHeader(ctx));

  const timeDifference = Math.abs(new Date().getTime() - signatureTimestamp);

  // Bigger than 10 secs for drift ?
  if (timeDifference > 10000) {
    return badResponse(ctx, `Time difference is ${timeDifference}`);
  }

  if (nonceSet.has(signatureNonce)) {
    return badResponse(ctx, 'Nonce already exists');
  }

  nonceSet.add(signatureNonce);

  const stringBody = JSON.stringify(ctx.request.body);

  const toHash = `${stringBody}${signatureNonce}${signatureTimestamp}`;

  const hash = createHmac('sha256', SECRET_KEY)
    .update(toHash)
    .digest('base64');

  return testHash(
    `${hash}:${signatureNonce}:${signatureTimestamp}`, getSignatureHeader(ctx), ctx, 'Failed to compare hmac'
  );
};
