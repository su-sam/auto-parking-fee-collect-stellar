const mongoose = require("mongoose");
const Joi = require("joi");

const User = mongoose.model("User", new mongoose.Schema({
  vn: {
    type: String,
    minlength: 4,
    maxlength: 6,
    trim: true,
    required: true
  },
  key: {
    type: String,
    minlength: 32,
    maxlength: 32,
    required: true
  },
  amount: {
    type: String
  }
})
);

function validateTotp(data) {
  const schema = {
    totp: Joi.string().min(6).max(6).required()
  };

  return Joi.validate(data, schema);
}

exports.User = User;
exports.validate = validateTotp;