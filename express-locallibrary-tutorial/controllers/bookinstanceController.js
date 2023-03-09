const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .then(function (list_bookinstances) {
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    })
    .catch(function (err) {
      if (err) {
        return next(err);
      }
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .then((bookinstance) => {
      if (bookinstance == null) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    })
    .catch((err) => {
      return next(err);
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").then((books) => {
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").then(function (books) {
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      })
      .catch(function (err) {
        return next(err);
      });
      return;
    }

    // Data from form is valid
    bookinstance.save().then(() => {
      // Successful: redirect to new record.
      res.redirect(bookinstance.url);
    })
    .catch((err) => {
      return next(err);
    });
  },
];

// Display BookInstance delete form on GET.
// TODO: make next argument accessible below
exports.bookinstance_delete_get = (req, res) => {
  BookInstance.findById(req.params.id).populate("book")
  .then((foundBookInstance) => {
    if (foundBookInstance == null) {
      res.redirect("/catalog/bookinstances");
    }
    res.render("bookinstance_delete", {
      title: "Delete BookInstance",
      bookinstance: foundBookInstance,
    })
  })
  .catch((err) => {
    return next(err);
  })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndRemove(req.body.bookinstanceid)
  .then(() => {
    res.redirect("/catalog/bookinstances");
  })
  .catch((err) => {
    return next(err);
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance update GET");
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance update POST");
};
