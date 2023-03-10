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
exports.bookinstance_delete_get = (req, res, next) => {
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
exports.bookinstance_update_get = (req, res, next) => {
  // catalog.js shows that when this request is made, the POST path contains id as a 
  // parameter, which can be extracted from the request via req.params.id

  // In the update form we should show details of the bookinstance to be updated (as 
  // a starting point for the changes), so we look for the BookInstance in the database

  // Populate the book field

  // Daisy-chain an orFail() method to the request (as mentioned in 
  // https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/forms/Update_Book_form)
  // so that if the BookInstance isn't found we go to the catch block

  // In parallel to the query above, find all the Books in the database so they can be shown as options
  // in the form

  // We add a catch block afterwards in case there is an error with the above, and supply 
  // the error to the 

  // If there is no error, we use a then block with the following:

  // Render bookinstance_form.pug, supplying the found BookInstance object in 
  // the 'bookinstance' parameter, so we get the form with the current details pre-rendered; supply 
  // foundBookInstance.book as the 'selected_book'; supply the foundBookArray as the 'book_list'

  // Then, in models/bookinstance.js, write a new virtual property that returns BookInstance.due_back 
  // as a string in the format "YYYY-MM-DD"

  // Access the virtual property in the date input in bookinstance_form.pug

  Promise.all(
    [
      BookInstance.findById(req.params.id)
        .orFail()
        .populate("book"),
      Book.find({}, "title"),
    ]
  )
  .then((results) => {
    const [foundBookInstance, foundBookArray] = results;
    res.render("bookinstance_form", {
      title: "Update BookInstance",
      bookinstance: foundBookInstance,
      book_list: foundBookArray,
      selected_book: foundBookInstance.book._id,
    });
  })
  .catch((err) => {
    return next(err);
  })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // First we must validate and sanitise the fields of the request's body, which have names: 
  // - 'book', the title of the book
  // - 'imprint', the imprint of the book
  // - 'due_back', the due date of the book
  // - 'status', the status of the book
  // Just do the same validation as in the controller 'bookinstance_create_post', using the 
  // 'body' function

  // All of the below happens in the next middleware function:

  // We use validationResult() to get an array of errors

  // We make a new BookInstance object out of the fields sanitised earlier in this controller, 
  // making sure to pass the old ID (req.params.id) to this new object so that it isn't 
  // reassigned

  // If the errors array is not empty, we render bookinstance_form.pug, passing to it the 
  // correct title, the new BookInstance object as 'bookinstance', foundBookArray (found 
  // by database search if there are errors) as 'book_list', the BookInstance object's 
  // book._id as 'selected_book', and the errors array returned by validationResult() as 
  // 'errors'

  // Otherwise, we findByIdAndUpdate the BookInstance, passing req.params.id as the ID, 
  // specifying the new BookInstance as the replacer, specifying {} as options (I.E. no 
  // options), then redirecting to resulting BookInstance's URL (coming from promise 
  // fulfillment)

  
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

    // Create a BookInstance object with escaped/trimmed data and old id.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all books for options for book field of form
      Book.find()
      .then((foundBookArray) => {
        res.render("bookinstance_form", {
          title: "Update BookInstance",
          bookinstance,
          book_list: foundBookArray,
          selected_book: bookinstance.book._id
        });
      })
      .catch((err) => {
        return next(err);
      });
      return
    }
    
    // Data from form is valid. Update the record.
    BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}).then((thebookinstance) => {
      // Successful: redirect to book detail page.
      res.redirect(thebookinstance.url);
    })
    .catch((err) => {
      return next(err);
    });
  }, 
];
