# rpc-rabbitmq

[![npm version](https://img.shields.io/npm/v/rpc-rabbitmq.svg)](https://npm.im/rpc-rabbitmq) ![Licence](https://img.shields.io/npm/l/rpc-rabbitmq.svg) [![Github issues](https://img.shields.io/github/issues/danielmeneses/rpc-rabbitmq.svg)](https://github.com/danielmeneses/rpc-rabbitmq/issues) [![Github stars](https://img.shields.io/github/stars/danielmeneses/rpc-rabbitmq.svg)](https://github.com/danielmeneses/rpc-rabbitmq/stargazers)

RPC pattern with RabbitMQ

## Table of contents

- [RPC client example](#rpc-client-example)
- [RPC server example](#rpc-server-example)
- [Some other patterns](#some-other-patterns)
  - [Simple Worker](#simple-worker)
  - [Pub-Sub](#pub-sub)
- [Contributions](#contributions)

### Install

```bash
npm i rpc-rabbitmq --save-prod
```

### RPC client example

You just need to define the methods that the client will use. This methods should be implemented in the server-side version.

```js
const { ClientRPC } = require('rpc-rabbitmq');

class Client extends ClientRPC {
  async getBooks() {}
  async getBook(id) {}
}

const client = new Client('clientName', 'amqp://rabbitmq:rabbitmq@localhost:5672');

(async function() {
  try {
    // start client
    await client.init();

    // get all books from the server
    const p1 = client.getBooks();

    // get book with id "2" from the server
    const p2 = client.getBook(2);

    // resolve both promises
    const [books, book1] = await Promise.all([p1, p2]);

    console.log(books, book1);

    // clear connection and channel
    await client.destroy();
  } catch (error) {
    console.error(error);
  }
})();
```

### RPC server example

```js
const { ServerRPC } = require('rpc-rabbitmq');

// simulating a books datasource
const books = [
  { id: 1, title: 'Da Vinci Code', author: 'Dan Brown' },
  { id: 2, title: 'Ensaio sobre a Cegueira', author: 'José Saramago' }
];

class Server extends ServerRPC {
  async getBooks() {
    return books;
  }

  async getBook(id) {
    for (let i = 0; i < books.length; i++)
      if (books[i].id === id) return books[i];
    return null;
  }
}

(async function() {
  const server = new Server(
    'server',
    'amqp://rabbitmq:rabbitmq@localhost:5672'
  );
  await server.init();
})();
```

As mentioned before, we need to implement all the methods in the server. Not really mandatory, but you should keep all methods "async". In the example there's no need for that, because the functions execution is completly sync.

### Some other patters comming along

The library also abstracts 2 more patterns, Work and Pub-Sub.

#### Simple Worker

```js
const { Publisher, Consumer } = require('rpc-rabbitmq');

const publisher = new Publisher(
  'publisherConn',
  'amqp://rabbitmq:rabbitmq@localhost:5672'
);

const consumer1 = new Consumer(
  'consumer1',
  'amqp://rabbitmq:rabbitmq@localhost:5672'
);

(async function() {
  // publisher code
  await publisher.connect();
  await publisher.createChannel();

  // Publisher creating a queue
  await publisher.createQueue('my_queue', { durable: false });

  // client consumer1
  const c1 = await consumer1.connect();
  const ch1 = await consumer1.createChannel();

  // consumer2 - Using existing connection and channel from consumer1
  const consumer2 = new Consumer('consumer2', null, ch1, c1);

  ch1.prefetch(1);
  // consume
  consumer1.consume('my_queue', { noAck: false }, msg => {
    setTimeout(() => {
      ch1.ack(msg);
    }, 1000);
  });
  consumer2.consume('my_queue', { noAck: false }, msg => {
    ch1.ack(msg);
  });

  for (let i = 0; i < 600; i++) publisher.sendToQueue('my_queue', i);
})();

```

#### Pub-Sub

```js
const { Publisher, Consumer } = require('rpc-rabbitmq');

const publisher = new Publisher(
  'publisher',
  'amqp://rabbitmq:rabbitmq@localhost:5672'
);

const subscriber = new Consumer(
  'subscriber',
  'amqp://rabbitmq:rabbitmq@localhost:5672'
);

(async function() {
  // publisher code
  await publisher.connect();
  await publisher.createChannel();

  // start doing stuff
  await publisher.createQueue('my_queue', { durable: false });
  await publisher.createExchange('my_exchange', 'topic');

  // client subscriber
  await subscriber.connect();
  const ch1 = await subscriber.createChannel();

  ch1.prefetch(1);
  // consume
  await subscriber.subscribe('my_exchange', 'pata.*', msg => {
    ch1.ack(msg);
  });

  for (let i = 0; i < 10; i++)
    publisher.sendToExchange('my_exchange', `pata.${i}`, i);
})();

```

## Contributions

Contributions are very welcome. There's a lot of room for improvements and new features so feel free to fork the repo and get into it. Also, let me know of any bugs you come across, any help on bug fixing is also a plus!
