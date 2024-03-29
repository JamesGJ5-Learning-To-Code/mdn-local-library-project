const { DateTime } = require("luxon");
const yyyymmdd = require("yyyy-mm-dd");

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for author's full name
AuthorSchema.virtual("name").get(function () {
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.family_name}, ${this.first_name}`;
  }
  if (!this.first_name || !this.family_name) {
    fullname = "";
  }
  return fullname;
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/author/${this._id}`;
});

function formatJSDate(JSDate) {
  return JSDate ? DateTime.fromJSDate(JSDate).toLocaleString(JSDate) : '';
}

AuthorSchema.virtual("date_of_birth_formatted").get(function () {
  return formatJSDate(this.date_of_birth);
});

AuthorSchema.virtual("date_of_death_formatted").get(function () {
  return formatJSDate(this.date_of_death);
});

AuthorSchema.virtual("date_of_birth_formatted_for_date_input").get(function() {
  return (this.date_of_birth) ? yyyymmdd(this.date_of_birth) : "";
});

AuthorSchema.virtual("date_of_death_formatted_for_date_input").get(function() {
  return (this.date_of_death) ? yyyymmdd(this.date_of_death) : "";
});

AuthorSchema.virtual("lifespan").get(function () {
  return `${this.date_of_birth_formatted} - ${this.date_of_death_formatted}`;
});

// Export model
module.exports = mongoose.model("Author", AuthorSchema);
