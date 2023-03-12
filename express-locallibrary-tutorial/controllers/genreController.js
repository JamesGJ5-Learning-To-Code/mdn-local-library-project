const Genre = require("../models/genre");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = (req, res) => {
  Genre.find()
    .sort([["name", "ascending"]])
    .then(function (list_of_genres) {
      res.render("genre_list", {
        title: "Genre List",
        genre_list: list_of_genres,
      });
    })
    .catch(function (err) {
      return next(err);
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  Promise.all(
    [
      Genre.findById(req.params.id),
      Book.find({ genre: req.params.id })
    ]
  )
  .then((results) => {
    if (results[0] == null) {
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }
    res.render("genre_detail", {
      title: "Genre Detail",
      genre: results[0],
      genre_books: results[1]
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // TODO: consider doing this in the else block within the else block 
    // below. If so, in the below if block, replace genre with 
    // 'genre: req.body.name' instead
    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name })
      .then((found_genre) => {
        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        } else {
          genre.save().then(() => {
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          })
          .catch((err) => {
            return next(err);
          });
        }
      })
      .catch((err) => {
        return next(err);
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  Promise.all(
    [
      Genre.findById(req.params.id),
      Book.find({ genre: req.params.id }),
    ]
  )
  .then((results) => {
    const [foundGenre, foundBookArray] = results;
    if (foundGenre == null) {
      res.redirect("/catalog/genres");
    }
    res.render("genre_delete", {
      title: "Delete Genre",
      genre: foundGenre,
      genre_books: foundBookArray,
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  Promise.all(
    [
      Genre.findById(req.body.genreid),
      Book.find({ genre: req.body.genreid }),
    ]
  )
  .then((results) => {
    const [foundGenre, foundBookArray] = results;
    if (foundBookArray.length > 0) {
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: foundGenre,
        genre_books: foundBookArray
      });
      return;
    }
    Genre.findByIdAndRemove(req.body.genreid).then(() => {
      res.redirect("/catalog/genres");
    })
    .catch((err) => {
      return next(err);
    })
  })
  .catch((err) => {
    return next(err);
  });
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id)
    .orFail()
  .then((foundGenre) => {
    res.render("genre_form", {
      title: "Update Genre",
      genre: foundGenre,
    });
  })
  .catch((err) => {
    return next(err);
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Update Genre",
        genre,
        errors: errors.array(),
      });
      return;
    }

    Genre.findByIdAndUpdate(req.params.id, genre, {}).then((thegenre) => {
      res.redirect(thegenre.url);
    })
    .catch((err) => {
      return next(err);
    })
  },
];
