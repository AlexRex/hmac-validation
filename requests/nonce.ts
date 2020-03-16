// tslint:disable: no-magic-numbers
import { createHmac } from 'crypto';
import axios from 'axios';

import { v4 as uuid } from 'uuid';

const http = axios.create({
  baseURL: 'http://localhost:8000'
});

const SECRET_KEY = 'secret-hmac-key-you-know';

const nonce = uuid();

const body = {
  mysecureInfo: 1234,
  nonce // nonce value
};

const bodyString = JSON.stringify(body);

const hmacHash = createHmac('sha256', SECRET_KEY)
  .update(bodyString)
  .digest('base64');

const config = {
  headers: {
    'x-hmac-signature': `${hmacHash}:${nonce}`
  }
};

http.post('/nonce', body, config)
  .then((resp) => {
    console.log(resp.data);

    // Repeat same request again!
    http.post('/nonce', body, config)
      .then((resp) => {
        console.log(resp.data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  })
  .catch((err) => {
    console.log(err.message);
  });
