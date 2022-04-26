// Integration tests for books route

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

const BOOKS_ROUTE = '/books';
const JSON = 'application/json';
const BOOK_PROPERTIES = [
  'isbn', 'amazon_url', 'author', 'language', 'pages',
  'publisher', 'title', 'year'
];

let book_isbn;

beforeEach(async () => {
  const result = await db.query(`
    INSERT INTO books
    (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES(
      '11111',
      'amazon.com',
      'author',
      'language',
      100,
      'publisher',
      'the title',
      1999
    )
    RETURNING isbn
  `);

  book_isbn = result.rows[0].isbn;
});

afterEach(async () => {
  await db.query('DELETE FROM books');
});

afterAll(async () => {
  await db.end();
});

describe(`GET ${BOOKS_ROUTE}`, () => {
  test('Gets a list of books', async () => {
    const res = await request(app).get(BOOKS_ROUTE);

    expect(res.statusCode).toEqual(200);
    expect(res.type).toBe(JSON);

    const { books } = res.body;
    expect(books).toHaveLength(1);

    const book = books[0];

    BOOK_PROPERTIES.forEach(p => expect(book).toHaveProperty(p));
  
  });
});

describe(`GET ${BOOKS_ROUTE}/:isbn`, () => {
  test('Gets data for 1 book', async () => {

    const res = await request(app).get(`${BOOKS_ROUTE}/${book_isbn}`);

    expect(res.statusCode).toEqual(200);
    expect(res.type).toBe(JSON);

    const { book } = res.body;

    BOOK_PROPERTIES.forEach(p => expect(book).toHaveProperty(p));
  });

  test('Sends 404 error if book not found', async () => {

    const res = await request(app).get(`${BOOKS_ROUTE}/INVALID`);

    expect(res.statusCode).toEqual(404);
    expect(res.type).toBe(JSON);
  });
});

describe(`POST ${BOOKS_ROUTE}`, () => {
  test('Creates a book', async () => {

    const bookData = {
      isbn: '123',
      amazon_url: 'amz.com',
      author: 'test author',
      language: 'test lang',
      pages: 999,
      publisher: 'test publisher',
      title: 'test title',
      year: 1000
    };

    const res = await request(app)
      .post(BOOKS_ROUTE)
      .send(bookData);

    expect(res.statusCode).toEqual(201);
    expect(res.type).toBe(JSON);
    expect(res.body.book).toEqual(bookData);

  });

  test('Does not allow book creation if fields are missing', async () => {

    const res = await request(app)
      .post(BOOKS_ROUTE)
      .send({ title: 'test title' });

      expect(res.statusCode).toEqual(400);
      expect(res.type).toBe(JSON);
  })
});

describe(`PUT ${BOOKS_ROUTE}`, () => {
  test('Updates a book', async () => {

    const updatedBookData = {
      amazon_url: 'amz.com',
      author: 'test author',
      language: 'test lang',
      pages: 999,
      publisher: 'test publisher',
      title: 'test title',
      year: 1000
    };

    const res = await request(app)
      .put(`${BOOKS_ROUTE}/${book_isbn}`)
      .send(updatedBookData);

    expect(res.statusCode).toEqual(200);
    expect(res.type).toBe(JSON);

    updatedBookData.isbn = book_isbn;
    expect(res.body.book).toEqual(updatedBookData);
  });

  test('Does not allow book update if isbn is included in request body', async () => {

    const bookDataWithIsbn = {
      isbn: '123',
      amazon_url: 'amz.com',
      author: 'test author',
      language: 'test lang',
      pages: 999,
      publisher: 'test publisher',
      title: 'test title',
      year: 1000
    };

    const res = await request(app)
      .put(`${BOOKS_ROUTE}/${book_isbn}`)
      .send(bookDataWithIsbn);

    expect(res.statusCode).toEqual(400);
    expect(res.type).toBe(JSON);
  });

  test('Sends 404 error if book not found', async () => {
    const updatedBookData = {
      amazon_url: 'amz.com',
      author: 'test author',
      language: 'test lang',
      pages: 999,
      publisher: 'test publisher',
      title: 'test title',
      year: 1000
    };

    const res = await request(app)
      .put(`${BOOKS_ROUTE}/INVALID`)
      .send(updatedBookData);

    expect(res.statusCode).toEqual(404);
    expect(res.type).toBe(JSON);
  });
});

describe(`DELETE ${BOOKS_ROUTE}`, () => {
  test('Deletes a book', async () => {

    const res = await request(app)
      .delete(`${BOOKS_ROUTE}/${book_isbn}`);

    expect(res.statusCode).toEqual(200);
    expect(res.type).toBe(JSON);
    expect(res.body).toEqual({ message: "Book deleted" });
  })
})