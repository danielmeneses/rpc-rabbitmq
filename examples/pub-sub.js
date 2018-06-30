const Publisher = require('../lib/Publisher');
const Consumer = require('../lib/Comsumer');

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
  await publisher.createQueue('pataniscas', { durable: false });
  await publisher.createExchange('to-pataniscas', 'topic');

  // client subscriber
  await subscriber.connect();
  const ch1 = await subscriber.createChannel();

  ch1.prefetch(1);
  // consume
  await subscriber.subscribe('to-pataniscas', 'pata.*', msg => {
    console.log(msg.content);
    ch1.ack(msg);
  });

  for (let i = 0; i < 10; i++)
    publisher.sendToExchange('to-pataniscas', `pata.${i}`, i);
})();
