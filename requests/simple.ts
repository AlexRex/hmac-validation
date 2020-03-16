// tslint:disable: no-magic-numbers
import { createHmac } from 'crypto';
import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8000'
});

const SECRET_KEY = 'secret-hmac-key-you-know';

const body = {
  mysecureInfo: 1234
};

const bodyString = JSON.stringify(body);

const hmacHash = createHmac('sha256', SECRET_KEY)
  .update(bodyString)
  .digest('base64');

const config = {
  headers: {
    'x-hmac-signature': hmacHash
  }
};

http.post('/simple', body, config)
  .then((resp) => {
    console.log(resp.data);

    body.mysecureInfo = 80;

    http.post('/simple', body, config)
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
