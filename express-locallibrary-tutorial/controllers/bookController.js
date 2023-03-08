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
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      Promise.all(
        [
          Author.find(),
          Genre.find(),
        ]
      )
      .then((results) => {
        // Mark our selected genres as checked.
        for (const genre of results[1]) {
          if (book.genre.includes(genre._id)) {
            genre.checked = "true";
          }
        }
        res.render("book_form", {
          title: "Create Book",
          authors: results[0],
          genres: results[1],
          book,
          errors: errors.array(),
        });
      })
      .catch((err) => {
        return next(err);
      });
      return;
    }

    // Data from form is valid. Save book.
    book.save().then(() => {
      // Successful: redirect to new book record.
      res.redirect(book.url);
    })
    .catch((err) => {
      return next(err);
    });
  },
];

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
