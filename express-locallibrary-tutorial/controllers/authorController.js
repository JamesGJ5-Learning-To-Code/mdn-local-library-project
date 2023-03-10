const Author = require("../models/author");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = function (req, res, next) {
  Author.find()
    .sort([["family_name", "ascending"]])
    .then(function (list_authors) {
      res.render("author_list", {
        title: "Author List",
        author_list: list_authors,
      });
    })
    .catch(function (err) {
      return next(err);
    });
}

// Display detail page for a specific Author.
exports.author_detail = (req, res, next) => {
  Promise.all(
    [
      Author.findById(req.params.id),
      Book.find({ author: req.params.id }, "title summary")
    ]
  )
  .then((results) => {
    if (results[0] == null) {
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }
    res.render("author_detail", {
      title: "Author Detail",
      author: results[0],
      author_books: results[1],
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "Create Author",
        author: req.body,
        errors: errors.array(),
      });
      return;
    }
    // Data from form is valid.

    // Create an Author object with escaped and trimmed data.
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });
    author.save().then(() => {
      res.redirect(author.url);
    })
    .catch((err) => {
      return next(err);
    });
  },
];

// Display Author delete form on GET.
exports.author_delete_get = (req, res, next) => {
  Promise.all(
    [
      Author.findById(req.params.id),
      Book.find({ author: req.params.id }),
    ]
  )
  .then((results) => {
    if (results[0] == null) {
      // No results.
      res.redirect("/catalog/authors");
    }
    res.render("author_delete", {
      title: "Delete Author",
      author: results[0],
      author_books: results[1],
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Handle Author delete on POST.
exports.author_delete_post = (req, res, next) => {
  Promise.all(
    [
      Author.findById(req.body.authorid),
      Book.find({ author: req.body.authorid }),
    ]
  )
  .then((results) => {
    // Success
    if (results[1].length > 0) {
      // Author has books. Render in same way as for GET route.
      res.render("author_delete", {
        title: "Delete Author",
        author: results[0],
        author_books: results[1],
      });
      return;
    }
    // Author has no books. Delete object and redirect to the list of authors.
    Author.findByIdAndRemove(req.body.authorid).then(() => {
      // Success - go to author list
      res.redirect("/catalog/authors");
    })
    .catch((err) => {
      return next(err);
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Display Author update form on GET.
exports.author_update_get = (req, res, next) => {
  // Taking id from req.params.id, find the Author object in the database via its ID, 
  // using orFail() to ensure the query is rejected if the Author is not found

  // If the above query is rejected, pass the error to the next piece of middleware.

  // If query is instead fulfilled, do the following:

  // Render an author_form with the following parameters:
  // - author: the author object that was found

  // Put a link in author_detail.pug that triggers a GET request with the correct URL

  Author.findById(req.params.id)
    .orFail()
  .then((foundAuthor) => {
    res.render("author_form", {
      title: "Update Author",
      author: foundAuthor,
    });
  })
  .catch((err) => {
    return next(err)
  })
};

// Handle Author update on POST.
exports.author_update_post = [
  // First, validate and sanitise the fields as in author_create_post

  // Do all of the following in the same middleware function, in which req, res and 
  // next are accessible:

  // First, use validationResult() to get an array of errors, called 'errors'

  // Make an Author (called 'author') using the sanitised fields (in req.body), making sure the 
  // ID chosen is req.params.id

  // If 'errors' is not empty, render author_form with author as an argument and then return

  // If 'errors' is instead empty:

  // Call findByIdAndUpdate on Author, passing req.params.id as the ID, 'author' as the new 
  // Author, and {} as the options

  // If the above is fulfilled, redirect to the URL of the Author returned in the fulfillment

  // If the above is instead rejected, call next with the rejection

  
];
