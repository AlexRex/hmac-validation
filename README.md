# hmac-validation
👮‍♂️Verify integrity of API requests using HMAC signatures 

The idea of this repo is to have a working example of different verifying levels of HMAC signature using Nodejs. 

## Summary

With this mechanism we can avoid that malicious attackers can intercept requests, modify the content and send them.

The main idea is that both client and server have the same secret key and try to create the same digest or signature, 
verifying that at both ends the content of a request is not modified. 

As the secret key is stored in the client as well this mechanism is useful to add layers of security but shouldn't be treated 
as 100% secure. 

There are 4 implementations with different layers in the repo. To start using them run the server: 

```
npm run start
```

Each of the implementations have an example request in the `/requests` dir. 

### Simple

For the simple verification we just create the a signature of the body in the client.
Then in the server we do the same and compare both results. If the HMAC is the same we're good. 

With this mechanism, a possible attacker will be able to **replay** the request but not change its contents. 

```
npm run example:simple
```

### Nonce

When introducing a Nonce we disable the replayability of the requests (for a limited time depending on the implementation).

With this one our digest will be formed with `${hmac(body+nonce)}:{nonce}`. We create a hmac of the combination body+nonce and include the plain nonce.

This way, when we get the request in the server we can regenerate the same signature using the nonce in the header and the full body. 

We should keep a list in a redis-a-like database or mechanism in order to verify that an already used Nonce is not used again. 
Usually the Nonces stored have a TTL in order to prevent having a collisions and faster data-access. 

```
npm run example:nonce
```

### Timestamp 

With a Nonce we already disable the **replay** of the requests... for a period of time. As we stated, unless you don't add a TTL to your nonces (something not recommended) 
it is not possible to the attacker to wait the TTL time and replay the requests again. 

In order to avoid this we can add another component: a timestamp. 

The same way we did with the nonce we add a timestamp to the digest `${hmac(body+nonce+timestamp)}:{nonce}:{timestamp}`. 
With this timestamp we can allow requests only inside a threshold, in order to avoid time drifts between client and server.

If the request timestamp is ouside of this threshold we can reject it. 

```
npm run example:timestamp
```

### Complete

Combination of Nonce and Timestamp strategies. 

```
npm run example:complete
```
