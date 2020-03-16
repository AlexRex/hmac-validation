// tslint:disable: no-magic-numbers
import { createHmac } from 'crypto';
import axios from 'axios';
// import curlirize from 'axios-curlirize';
import { v4 as uuid } from 'uuid';

const http = axios.create();

// curlirize(http);

const SECRET_KEY = 'secret-hmac-key-you-know';

const requestTimestamp = new Date().getTime();
const nonce = uuid();

const body = {
  mysecureInfo: 1234,
  requestTimestamp,
  nonce
};

const bodyString = JSON.stringify(body);

const hmacHash = createHmac('sha256', SECRET_KEY)
  .update(bodyString)
  .digest('base64');

const config = {
  headers: {
    'Content-Type': 'application/json',
    'x-hmac-signature': `${hmacHash}:${nonce}:${requestTimestamp}` // using same structureas nonce
  }
};

const wait = (ms: number) => {
  const start = new Date().getTime();
  let end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
};

http.post('http://localhost:8000/complete', body, config)
  .then(async (resp) => {
    console.log(resp.data);

    await http.post('http://localhost:8000/complete', body, config)
      .then((resp) => {
        console.log(resp.data);
      })
      .catch((err) => {
        console.log(err.message);
      });

    wait(10000);

    await http.post('http://localhost:8000/complete', body, config)
      .then((resp) => {
        console.log(resp.data);
      })
      .catch((err) => {
        console.log(err.message);
      });

    const newDate = new Date().getTime();
    const newNonce = 'new-nonce';

    body.nonce = newNonce;
    body.requestTimestamp = newDate;
    config.headers['x-hmac-signature'] = `${hmacHash}:${newNonce}:${newDate}`;

    await http.post('http://localhost:8000/complete', body, config)
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
