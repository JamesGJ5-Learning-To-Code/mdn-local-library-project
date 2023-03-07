const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

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
  });
  // TODO: add an acceptable catch
};

// Display list of all books.
exports.book_list = (req, res) => {
  res.send("NOT IMPLEMENTED: Book list");
};

// Display detail page for a specific book.
exports.book_detail = (req, res) => {
  res.send(`NOT IMPLEMENTED: Book detail: ${req.params.id}`);
};

// Display book create form on GET.
exports.book_create_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Book create GET");
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
