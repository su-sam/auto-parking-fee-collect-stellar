const express = require("express");
const otplib = require("otplib");

const { User } = require("../models/sharedKey");

const router = express.Router();

// assume camera vehicle no
const camVehicleNo = "6784";

// get shared key
router.get("/:vehicleNo", async (req, res) => {

  if (!(camVehicleNo === req.params.vehicleNo)) return res.status(405).send("Invalid vehicle number ...");

  // generate new shared key
  const secret = generateKey();
  // after that Server save shared-key to DB
  try {
    let sharedKey = await User.findOne({ vn: req.params.vehicleNo });
    if (sharedKey) return res.status(400).send('Vehicle Number is already registered.');

    sharedKey = await createData(req.params.vehicleNo, secret); // save to DB
    res.send({ "secretKey": sharedKey.key });
  } catch (e) { console.error(e); }


});

// FUNCTION for save key to Database
const createData = async (vehicleNo, secret) => {
  // create new Data
  const data = new User({
    vn: vehicleNo,
    key: secret
  });
  // save data to DB
  try {
    const result = await data.save();
    console.log("SAVED SHARED KEY DATA TO DB !!", result);
    return result;
  } catch (e) {
    console.error(e);
  }
};
// FUNCTION for generate shared-key
function generateKey() {
  return otplib.authenticator.generateSecret(); // secret
}

module.exports = router;