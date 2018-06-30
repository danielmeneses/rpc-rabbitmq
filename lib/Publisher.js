const RabbitMQ = require('./RabbitMQ');

class Publisher extends RabbitMQ {
  async sendToQueue(queueName, content, options) {
    try {
      await this._channel.sendToQueue(
        queueName,
        content instanceof Buffer
          ? content
          : new Buffer(
              typeof content !== 'string' ? JSON.stringify(content) : content
            ),
        options
      );
    } catch (error) {
      console.error(error);
    }
    return this;
  }

  async sendToExchange(exchangeName, routKey, content, options = {}) {
    try {
      await this._channel.publish(
        exchangeName,
        routKey,
        content instanceof Buffer
          ? content
          : new Buffer(
              typeof content !== 'string' ? JSON.stringify(content) : content
            ),
        options
      );
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Publisher;
