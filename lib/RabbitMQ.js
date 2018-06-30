const amqp = require('amqplib');
const NonExistingQueue = require('./exceptions/NonExistingQueue');
const NonExistingExchange = require('./exceptions/NonExistingExchange');

class RabbitAMQP {
  constructor(connChannelName, connectionStr, channel, conn) {
    this._connChannelName = connChannelName;
    this._connStr = connectionStr;
    this._channel = channel ? channel : null;
    this._conn = conn ? conn : null;
  }

  async connect() {
    if (this._conn === null)
      try {
        this._conn = await amqp.connect(this._connStr);
        console.log(
          'New connection to RabbitMQ started!',
          this._connChannelName
        );
        this._conn.on('close', () => {
          console.log('Connection closed...', this._connChannelName);
        });
      } catch (error) {
        console.error(error);
      }

    return this;
  }

  async createChannel() {
    if (this._channel === null)
      try {
        this._channel = await this._conn.createChannel();
        this._channel.on('error', e => {
          console.error(`Channel got an Error ${this._name}: `, e);
          this._channel.close();
          process.exit(1);
        });
        this._channel.on('close', () => {
          console.log('Channel closed...', this._connChannelName);
        });
      } catch (error) {
        console.error(error);
      }

    return this._channel;
  }

  async closeChannel() {
    if (this._channel !== null)
      try {
        console.log('Closing channel...', this._connChannelName);
        await this._channel.close();
        this._channel = null;
      } catch (error) {
        console.error(error);
      }

    return this;
  }

  async closeConnection() {
    if (this._conn !== null)
      try {
        console.log('Closing connection...', this._connChannelName);
        await this._conn.close();
        this._conn = null;
        this._channel = null;
      } catch (error) {
        console.error(error);
      }

    return this;
  }

  async createQueue(queueName, options) {
    try {
      const queue = await this._channel.assertQueue(queueName, options);
      return queue;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  async createExchange(exchangeName, type, options) {
    try {
      const exchange = await this._channel.assertExchange(
        exchangeName,
        type,
        options
      );
      return exchange;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  async bindToQueue(queueName, exchangeName = '', bindingKey = '', args = {}) {
    try {
      const ok = await this._channel.checkQueue(queueName);
      if (!ok)
        throw new NonExistingQueue(
          `The queue "${queueName}" was not found. Could not bind!`
        );

      await this._channel.bindQueue(queueName, exchangeName, bindingKey, args);
    } catch (error) {
      console.error(error);
    }
    return this;
  }

  async bindToExchange(
    destExchangeName,
    srcExchangeName,
    pattern = '',
    args = {}
  ) {
    try {
      const ok1 = await this._channel.checkExchange(destExchangeName);
      const ok2 = await this._channel.checkExchange(srcExchangeName);
      if (!ok1)
        throw new NonExistingExchange(
          `The exchange "${destExchangeName}" was not found. Could not bind!`
        );

      if (!ok2)
        throw new NonExistingExchange(
          `The exchange "${srcExchangeName}" was not found. Could not bind!`
        );

      await this._channel.bindExchange(
        destExchangeName,
        srcExchangeName,
        pattern,
        args
      );
    } catch (error) {
      console.error(error);
    }
    return this;
  }

  async destroy() {
    await this.closeChannel();
    await this.closeConnection();
  }

  getChannel() {
    return this._channel;
  }

  getConnection() {
    return this._conn;
  }

  getConnectionName() {
    return this._connChannelName;
  }
}

module.exports = RabbitAMQP;
