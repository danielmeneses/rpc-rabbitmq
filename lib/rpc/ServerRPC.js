const Consumer = require('../Comsumer');
const Publisher = require('../Publisher');
const { RPC_QUEUE_NAME } = require('./constants');

module.exports = class ServerRPC {
  constructor(connChannelName, connectionStr, channel = '', conn = '') {
    this._consumer = new Consumer(
      connChannelName,
      connectionStr,
      channel,
      conn
    );
  }

  async init() {
    const conn = await this._consumer.connect();
    const channel = await this._consumer.createChannel();

    this._publisher = new Publisher('serverPublisher', null, channel, conn);

    channel.prefetch(1);
    this._callbackQueue = await this._consumer.createQueue(RPC_QUEUE_NAME, {
      durable: false
    });

    this._consumer.consume(this._callbackQueue.queue, { noAck: false }, msg => {
      (async function() {
        const metadata = msg.content.pop();
        try {
          const response = await this[metadata.methodName](...msg.content);
          this._publisher.sendToQueue(metadata.cbQueue, [
            null,
            response,
            metadata
          ]);
        } catch (error) {
          console.error(error);
          this._publisher.sendToQueue(metadata.cbQueue, [
            error,
            null,
            metadata
          ]);
        } finally {
          this._publisher.getChannel().ack(msg);
        }
      }.bind(this)());
    });
  }
};
