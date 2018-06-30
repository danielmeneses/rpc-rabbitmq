const RabbitMQ = require('./RabbitMQ');
const NonExistingQueue = require('./exceptions/NonExistingQueue');

class Consumer extends RabbitMQ {
  async consume(queueName, options, msgCallback) {
    try {
      const ok = await this._channel.checkQueue(queueName);
      if (!ok)
        throw new NonExistingQueue(`Queue with name ${queueName} not found!`);

      await this._channel.consume(
        queueName,
        function(msg) {
          const tempContent = msg.content.toString('utf8');
          try {
            const content = JSON.parse(tempContent);
            msg.content = content;
          } catch (error) {
            // do stuff
            msg.content = tempContent;
          }
          msgCallback(msg);
        },
        options
      );
    } catch (error) {
      console.error(error);
    }
  }

  async subscribe(exchangeName, pattern, consumeCallback, bindToQueueArgs) {
    const queueObj = await this.createQueue('', { exclusive: true });
    await this.bindToQueue(
      queueObj.queue,
      exchangeName,
      pattern,
      !bindToQueueArgs ? {} : bindToQueueArgs
    );
    this.consume(queueObj.queue, { noAck: false }, consumeCallback);
  }
}

module.exports = Consumer;
