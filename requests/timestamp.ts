// tslint:disable: no-magic-numbers
import { createHmac } from 'crypto';
import axios from 'axios';
// import curlirize from 'axios-curlirize';

const http = axios.create();

// curlirize(http);

const SECRET_KEY = 'secret-hmac-key-you-know';

const requestTimestamp = new Date().getTime();

const body = {
  mysecureInfo: 1234,
  requestTimestamp
};

const bodyString = JSON.stringify(body);

const hmacHash = createHmac('sha256', SECRET_KEY)
  .update(bodyString)
  .digest('base64');

const config = {
  headers: {
    'Content-Type': 'application/json',
    'x-hmac-signature': `${hmacHash}:fake-nonce:${requestTimestamp}` // using same structureas nonce
  }
};

const wait = (ms: number) => {
  const start = new Date().getTime();
  let end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
};

// body.kicks[0].ballSpeed = 80;

http.post('http://localhost:8000/timestamp', body, config)
  .then((resp) => {
    console.log(resp.data);

    wait(10000);

    http.post('http://localhost:8000/timestamp', body, config)
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
