const express = require("express");
const moment = require("moment");
const StellarSdk = require("stellar-sdk");
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

const { User } = require("../models/sharedKey");
const { validate } = require("../models/fee");

const router = express.Router();

// assume camera vehicle no
const camVehicleNo = "6784";
// calculate fee and update in DB
router.post("/:vehicleNo", async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if (!(camVehicleNo === req.params.vehicleNo)) return res.status(405).send("Invalid vehicle number ...");
    try {
        // Node get time stamp
        const enterTimestamp = await getTimestamp(req.body.txEnterId);
        const exitTimestamp = await getTimestamp(req.body.txExitId);
        // Node calculate fee
        const amount = calculateFee(enterTimestamp, exitTimestamp);
        // Save amount to DB
        const user = await User.findOneAndUpdate({ vn: vehicleNo }, { amount: amount }, { new: true });
        if (!user) return res.status(404).send('The user with the given vehicle no was not found.');

        res.send({ "amount": amount });
    } catch (e) { console.error(e); }
});
// FUNCTION for get timeStamp
const getTimestamp = async txId => {
    const tx_result = await transactionViewer(txId);
    return tx_result.created_at;
};
// FUNCTION for view xdr
const transactionViewer = async txId => {
    return await server
        .transactions()
        .transaction(txId)
        .call();
};
// FUNCTION for calculate fee
function calculateFee(enterTime, exitTime) {
    // timestamp duration
    const startTime = moment(enterTime);
    const endTime = moment(exitTime);
    // different millisec
    const diff = endTime.diff(startTime);
    const duration = moment.duration(diff);
    // how long user park
    const hours = duration.asHours();
    // fee rate
    const feePerHour = 35;
    // calculate fee
    let amount = hours * feePerHour;
    amount = amount.toPrecision(7);
    return amount.toString();
}


module.exports = router;