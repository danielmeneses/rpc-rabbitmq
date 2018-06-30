/*eslint no-unused-vars: ["error", { "argsIgnorePattern": ".*" }]*/
const ClientRPC = require('../../lib/rpc/ClientRPC');

class Client extends ClientRPC {
  async getBookAuthor(bookId) {}
}

const client = new Client('client2', 'amqp://rabbitmq:rabbitmq@localhost:5672');

(async function() {
  try {
    await client.init();
    const result = await client.getBookAuthor(2);
    console.log(
      `Response ${client.getConnectionName()} - getBookAuthor(2):`,
      result
    );
    await client.destroy();
  } catch (error) {
    console.error(error);
  }
})();
