const express = require("express");
const Book = require("../models/book");
const jsonschema = require('jsonschema');
const ExpressError = require("../expressError");
const newBookSchema = require('../schemas/newBookSchema.json');
const updateBookSchema = require('../schemas/updateBookSchema.json');

const router = new express.Router();


/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:isbn", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.isbn);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {
    const bookData = jsonschema.validate(req.body, newBookSchema);

    if (!bookData.valid) {
      const errors = bookData.errors.map(e => e.stack);
      throw new ExpressError(errors, 400);
    }

    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    console.log(req.params.isbn);
    if ('isbn' in req.body) {
      throw new ExpressError('Not Allowed.', 400);
    }

    const bookData = jsonschema.validate(req.body, updateBookSchema);

    if (!bookData.valid) {
      const errors = bookData.errors.map(e => e.stack);
      throw new ExpressError(errors, 400);
    }
    
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
