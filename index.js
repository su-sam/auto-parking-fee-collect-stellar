const key = require("./routes/key");
const auth = require("./routes/auth");
const submitXdr = require("./routes/xdr");
const calFee = require("./routes/fee");

const mongoose = require("mongoose");
const express = require("express");
const Joi = require("joi");

Joi.objectId = require("joi-objectid")(Joi);

const app = express();
app.use(express.json());


//router that url path
app.use("/key", key);
app.use("/auth", auth);
app.use("/xdr", submitXdr);
app.use("/fee", calFee);

// connect to db
// connect to db
mongoose.connect('mongodb://localhost/users')
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...'));

//network connection
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
