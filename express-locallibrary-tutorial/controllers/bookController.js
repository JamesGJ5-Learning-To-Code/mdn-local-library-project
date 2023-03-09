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

// Plans for book_delete_get controller function:

// - Each BookInstance object has a reference to a Book object

// - In the view for deleting a Book object, if there are BookInstance objects referring to the 
// Book object, display them and tell the user they must be deleted before the Book is. See 
// author_delete.pug for inspiration, where a conditional checks if the BookInstance objects 
// have been deleted or not

// - If there are no relevant BookInstances, a delete button (to POST the deletion request) 
// should be shown in said view. See else block in the conditional mentioned above for 
// inspiration.

// Display book delete form on GET.
exports.book_delete_get = (req, res) => {
  // - In req, we have the ID of the Book.

  // - So, we findById the Book in the database.
  // - IN PARALLEL, We also get a list of BookInstance objects referring to this Book by 
  //   finding all BookInstance objects where there's a match for the parameters book: 
  //   req.params.id (may have to convert to ObjectID if there is an issue here).

  // - If either of these fail, then in our catch block, we simply propagate the error to 
  // the next piece of middleware
  // - If, instead, both are successful, we continue.

  // - Next, we check if there was NO Book found. Therefore, the Book should already have been 
  // deleted, so redirect the user to catalog/books (which will still be accessible)
  // - Otherwise, we render a book_delete.pug view, passing to it the Book and the 
  // BookInstance list

  // - Finally, write the book_delete.pug view

  Promise.all(
    [
      Book.findById(req.params.id)
        .populate("author")
        .populate("genre"),
      BookInstance.find({ book: req.params.id }),
    ]
  )
  .then((results) => {
    if (results[0] == null) {
      // Book not found
      res.redirect("/catalog/books");
    }
    console.log(results[0]);
    res.render("book_delete", {
      title: "Delete Book",
      book: results[0],
      book_bookinstances: results[1],
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Handle book delete on POST.
exports.book_delete_post = (req, res) => {
  // - In req.body.bookid we have the ID of the Book to be deleted

  // - So, we findById the Book in the database, using req.body.bookid
  // - In PARALLEL, we also look for the BookInstances in the database matching 
  // book: req.body.bookid; we do this so that, later, if there are any, we render the same 
  // view as we do in the book_delete_get controller above

  // - We attach a catch block to return next(err) if err is not null
  // - Otherwise, we continue in a then block

  // - In then(), If the book has bookinstances, render the deletion page just as in book_delete_get
  // - Otherwise, we make a deletion using Book.findByIdAndRemove()
  // - In an attached then block we redirect the user to "catalog/books"
  // - In the catch block, simply handle the error as mentioned above for the outer catch 
  // block

  Promise.all(
    [
      Book.findById(req.body.bookid)
        .populate("author")
        .populate("genre"),
      BookInstance.find({ book: req.body.bookid }),
    ]
  )
  .then((results) => {
    if (results[0].length > 0) {
      res.render("book_delete", {
        title: "Delete Book",
        book: results[0],
        book_bookinstances: results[1],
      });
      return;
    }
    Book.findByIdAndRemove(req.body.bookid).then(() => {
      res.redirect("/catalog/books");
    })
    .catch((err) => {
      return next(err);
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
  // Get book, authors and genres for form.
  Promise.all(
    [
      Book.findById(req.params.id)
        .populate("author")
        .populate("genre"),
      Author.find(),
      Genre.find(),
    ]
  )
  .then((results) => {
    // TODO: consider daisy-chaining the method orFail() to the Book.findById query above 
    // so that an error is indeed thrown if the Book is not found, meaning the catch block
    // below will be accessed rather than the following if block (at the end of which 
    // is a return statement anyway)
    if (results[0] == null) {
      // No results.
      const err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    // Mark our selected genres as checked.
    for (const genre of results[2]) {
      for (const bookGenre of results[0].genre) {
        if (genre._id.toString() === bookGenre._id.toString()) {
          genre.checked = "true";
        }
      }
    }
    res.render("book_form", {
      title: "Update Book",
      authors: results[1],
      genres: results[2],
      book: results[0],
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array
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

    // Create a Book object with escaped/trimmed data and old id.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id, //This is required, or a new ID will be assigned!
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
          title: "Update Book",
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

    // Data from form is valid. Update the record.
    Book.findByIdAndUpdate(req.params.id, book, {}).then((thebook) => {
      // Successful: redirect to book detail page.
      res.redirect(thebook.url);
    })
    .catch((err) => {
      return next(err);
    });
  },
];
