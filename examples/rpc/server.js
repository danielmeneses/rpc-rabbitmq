const ServerRPC = require('../../lib/rpc/ServerRPC');

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

  async getBookAuthor(bookId) {
    const book = await this.getBook(bookId);
    return book.author;
  }
}

(async function() {
  const server = new Server(
    'server',
    'amqp://rabbitmq:rabbitmq@localhost:5672'
  );
  await server.init();
})();
