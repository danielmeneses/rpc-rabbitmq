/*eslint no-unused-vars: ["error", { "argsIgnorePattern": ".*" }]*/
const ClientRPC = require('../../lib/rpc/ClientRPC');

class Client extends ClientRPC {
  async getBooks() {}
  async getBook(id) {}
}

const client = new Client('client1', 'amqp://rabbitmq:rabbitmq@localhost:5672');

(async function() {
  try {
    await client.init();
    const p1 = client.getBooks();
    const p2 = client.getBook(1);
    const [result, result2] = await Promise.all([p1, p2]);

    console.log(`Response ${client.getConnectionName()} - getBooks():`, result);
    console.log(
      `Response ${client.getConnectionName()} - getBooks(1):`,
      result2
    );
    await client.destroy();
  } catch (error) {
    console.error(error);
  }
})();
