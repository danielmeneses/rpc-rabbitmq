const Consumer = require('../Comsumer');
const Publisher = require('../Publisher');
const RabbitMQ = require('../RabbitMQ');
const uuid = require('uuid/v4');
const EventEmitter = require('events');
const { RPC_QUEUE_NAME, RPC_MSG_EVENT } = require('./constants');

class Events extends EventEmitter {}
const events = new Events();

module.exports = class ClientRPC extends RabbitMQ {
  constructor(connChannelName, connectionStr, channel = '', conn = '') {
    super(connChannelName, connectionStr, channel, conn);
  }

  async init() {
    await this.connect();
    await this.createChannel();

    this._consumer = new Consumer(
      `${this._connChannelName}-consumer`,
      null,
      this._channel,
      this._conn
    );

    this._publisher = new Publisher(
      `${this._connChannelName}-publisher`,
      null,
      this._channel,
      this._conn
    );

    this._channel.prefetch(1);
    this._callbackQueue = await this._consumer.createQueue('', {
      durable: false,
      exclusive: true
    });

    this._consumer.consume(this._callbackQueue.queue, { noAck: false }, msg => {
      events.emit(RPC_MSG_EVENT, msg);
    });

    const functions = Object.getOwnPropertyNames(this.constructor.prototype);
    for (let i = 0; i < functions.length; i++) {
      const key = functions[i];
      switch (key) {
        case 'init':
        case 'constructor':
          break;
        default:
          this.constructor.prototype[key] = (...args) => {
            const requestId = uuid();
            args.push({
              requestId,
              cbQueue: this._callbackQueue.queue,
              methodName: key,
              className: this.constructor.name
            });
            this._publisher
              .sendToQueue(RPC_QUEUE_NAME, args)
              .catch(console.error);
            return new Promise((resolve, reject) => {
              const callBck = msg => {
                const { requestId: id } = msg.content.pop();
                if (id === requestId) {
                  this._consumer.getChannel().ack(msg);

                  if (msg.content[0]) reject(msg.content[0]);
                  else resolve(msg.content[1]);

                  events.removeListener(RPC_MSG_EVENT, callBck);
                } else this._consumer.getChannel().nack(msg);
              };
              events.on(RPC_MSG_EVENT, callBck);
            });
          };
          break;
      }
    }
  }
};
