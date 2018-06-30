const Publisher = require('../lib/Publisher');
const Consumer = require('../lib/Comsumer');

const publisher = new Publisher(
  'publisherConn',
  'amqp://mobidea-com:mobidea-com@localhost:5672'
);

const consumer1 = new Consumer(
  'consumer1',
  'amqp://mobidea-com:mobidea-com@localhost:5672'
);

(async function() {
  // publisher code
  await publisher.connect();
  await publisher.createChannel();

  // start doing stuff
  await publisher.createQueue('pataniscas', { durable: false });

  // client consumer1
  const c1 = await consumer1.connect();
  const ch1 = await consumer1.createChannel();

  // consumer2
  const consumer2 = new Consumer('consumer2', null, ch1, c1);

  ch1.prefetch(1);
  // consume
  consumer1.consume('pataniscas', { noAck: false }, msg => {
    setTimeout(() => {
      console.log(`${consumer1.getConnectionName()}`, msg.content);
      ch1.ack(msg);
    }, 5000);
  });
  consumer2.consume('pataniscas', { noAck: false }, msg => {
    console.log(`${consumer2.getConnectionName()}`, msg.content);
    ch1.ack(msg);
  });

  for (let i = 0; i < 600; i++) publisher.sendToQueue('pataniscas', i);
})();
