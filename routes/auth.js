const express = require("express");
const otplib = require("otplib");

const { User, validate } = require("../models/key");

const router = express.Router();

// assume camera vehicle no
const camVehicleNo = "6784";

// you can gen TOTP assume as you are mobile app at testapi-totp.js
// verify TOTP
router.post("/:vehicleNo", async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if (!(req.params.vehicleNo === camVehicleNo)) return res.status(405).send("Invalid vehicle number ...");
    try {
        const data = await User.find({ vn: req.params.vehicleNo }, { key: 1 });
        if (data === null) return res.status(400).send("Invalid vehicle number ...");

        token = req.body.totp;
        const isValid = await verifyTOTP(token, data[0].key);
        if (isValid) res.send({ "status": "verified", "accID": "GDA4TJRV3D5LEIJJGRHFLGFADDDWG37FSJCBJKRGAVQ4NLBV5MUZLFLD" });
    } catch (e) { console.error(e); }
});

// FUNCTION for TOTP verification
function verifyTOTP(token, secret) {
    return otplib.authenticator.check(token, secret); // is valid?
}

module.exports = router;