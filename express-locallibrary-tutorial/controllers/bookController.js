const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const { body, validationResult } = require("express-validator");

const async = require("async");

exports.index = (req, res) => {
  Promise.all(
    [
      Book.countDocuments({}),
      BookInstance.countDocuments({}),
      BookInstance.countDocuments({ status: "Available" }),
      Author.countDocuments({}),
      Genre.countDocuments({})
    ]
  ).then((results) => {
    const countsObject = {};
    const countNames = [
      "book_count",
      "book_instance_count",
      "book_instance_available_count",
      "author_count",
      "genre_count"
    ];
    countNames.forEach((name, index) => {
      const count = results[index];
      countsObject[name] = count;
    });
    // TODO: replace the above naming method with a more succinct process
    res.render("index", {
      title: "Local Library Home",
      data: countsObject,
    });
  }).catch((rejection) => {
    res.render("index", {
      title: "Local Library Home",
      error: rejection
    });
  });
  // TODO: DRY above
};

// Display list of all books.
exports.book_list = function (req, res, next) {
  Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .then(function (list_books) {
      res.render("book_list", { title: "Book List", book_list: list_books });
    })
    .catch(function (err) {
      if (err) {
        return next(err);
      }
    });
    // TODO: make sure the above catch works correctly
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
  Promise.all(
    [
      Book.findById(req.params.id)
        .populate("author")
        .populate("genre"),
      BookInstance.find( { book: req.params.id }),
    ]
  )
  .then((results) => {
    if (results[0] == null) {
      // No results.
      const err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }
    res.render("book_detail", {
      title: results[0].title,
      book: results[0],
      book_instances: results[1],
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  // Get all authors and genres, which we can use for adding to our book.
  Promise.all(
    [
      Author.find(),
      Genre.find(),
    ]
  )
  .then((results) => {
    res.render("book_form", {
      title: "Create Book",
      authors: results[0],
      genres: results[1],
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Handle book create on POST.
exports.book_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Book create POST");
};

// Display book delete form on GET.
exports.book_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Book delete GET");
};

// Handle book delete on POST.
exports.book_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Book delete POST");
};

// Display book update form on GET.
exports.book_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Book update GET");
};

// Handle book update on POST.
exports.book_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Book update POST");
};
