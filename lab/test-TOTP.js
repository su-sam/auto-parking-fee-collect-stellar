const otplib = require("otplib");
const mongoose = require("mongoose"); // only Server

// ========== Server ==========
// JSON schema for DB
const dataSchema = new mongoose.Schema({
  vn: String,
  key: String
});
// data model for DB
const Data = mongoose.model("Data", dataSchema);
// FUNCTION for connect to DB ....
const connectDB = async () => {
  try {
    const testDB = await mongoose.connect("mongodb://localhost/shared_key");
    console.log("connected to test DB ...");
  } catch (e) {
    console.error(e);
  }
};
// FUNCTION for save key to Database
const createData = async (vehicleNo, secret) => {
  // create new Data
  const data = new Data({
    vn: vehicleNo,
    key: secret
  });
  // save data to DB
  try {
    const result = await data.save();
    console.log("SAVED DATA TO DB !!");
  } catch (e) {
    console.error(e);
  }
};
// FUNCTION for get key from Database where vehicle no.
const getData = async vehicleNo => {
  try {
    const data = await Data.find({ vn: vehicleNo });
    if (!data) return;
    return data[0].key;
  } catch (e) {
    console.error(e);
  }
};
// FUNCTION for delete key from Database
const delData = async vehicleNo => {
  try {
    const data = await Data.find({ vn: vehicleNo });
    const del = await Data.findOneAndDelete(data[0].id);
    console.log("DELETE DATA FROM DB!!");
  } catch (e) {
    console.error(e);
  }
};
// FUNCTION for generate shared-key
function generateKey() {
  return otplib.authenticator.generateSecret(); // secret
}
// FUNCTION for TOTP verification
function verifyTOTP(token, secret) {
  return otplib.authenticator.check(token, secret); // is valid?
}

// ========== App ==========
// FUNCTION for implement token
function implementTOTP(secret) {
  return otplib.authenticator.generate(secret); //token
}

// ========== TEST ==========
const start = async () => {
  // ========== Entry ==========
  const vehicleNo = "1กง6798";
  // Server recieve key-request from app
  // Server compare Camera's vehicle no. and App's vehicle no.
  // Server generate shared-key
  const secret = generateKey(); // then Sever send the shared-key to App
  // App implement TOTP from the shared-key
  const token = implementTOTP(secret); // then App send the TOTP back to Server
  // Server verified the token
  const isValid = verifyTOTP(token, secret);
  // then Server and App do the stellar manage data transaction process
  if (isValid) console.log("DO entry-Manage-Data tx");
  // after that Server save shared-key to DB
  await connectDB(); // connect to DB
  await createData(vehicleNo, secret); // save to DB

  // ========== Exit ==========
  // const vehicleNo = '1กง6798';
  // Server recieve login request from app
  // Server compare Camera's vehicle no. and App's vehicle no.
  // Server get shared-key from DB where vehicle no.
  // await connectDB(); // connect to DB
  const sharedKey = await getData(vehicleNo);
  // App implement TOTP from the shared-key that stored in device
  const token2 = implementTOTP(secret); // then App send the TOTP to Server
  // Server verified the token
  const isValid2 = verifyTOTP(token2, sharedKey);
  // then Server and App do the stellar manage data transaction process
  if (isValid2) console.log("DO exit-Manage-Data tx\n" + "DO payment tx");
  // after that Server send notification to App for recieved, to DELETE shared-key
  // App DELETE shared-key that stored in App's Device
  // Server delete shared-key from DB where vehicle no. (DELETE row)
  await delData(vehicleNo);
};
start();
