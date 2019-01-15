const express = require("express");
const StellarSdk = require("stellar-sdk");
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
const { Transaction } = require("stellar-base");
const { validateXdr } = require("../models/xdr");
const { validateXdrTx } = require("../models/xdrNTx");
const { User } = require("../models/sharedKey");

// assume camera vehicle no
const camVehicleNo = "6784";

const router = express.Router();

// Node Store his data
const nodeKeys = StellarSdk.Keypair.fromSecret("SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y");
// entry - manage data tx read&sign
// 1: 4219 ms
router.post("/entry/:vehicleNo", async (req, res) => {
    const { error } = validateXdr(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if (!(req.params.vehicleNo === camVehicleNo)) return res.status(405).send("Invalid vehicle number ...");
    try {
        const txEnterId = await signEnterManageData(req.body.xdr);
        if (txEnterId == null) return res.status(405).send("Transaction failed ...");
        res.send({ "status": "success", "txId": txEnterId });
    } catch (e) { console.error(e); res.error(e) }
});
// exit - manage data tx read&sign
// 1: 7937 ms
router.post("/exit/:vehicleNo", async (req, res) => {
    const { error } = validateXdrTx(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if (!(req.params.vehicleNo === camVehicleNo)) return res.status(405).send("Invalid vehicle number ...");
    try {
        const txEnterId = await signExitManageData(req.body.xdr, req.body.txId);
        if (txEnterId == null) return res.status(405).send("Transaction failed ...");
        res.send({ "status": "success", "txId": txEnterId });
    } catch (e) { console.error(e); res.error(e) }
});
// payment data tx read&sign
// 1: 6208 ms
router.post("/pay/:vehicleNo", async (req, res) => {
    const { error } = validateXdr(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if (!(req.params.vehicleNo === camVehicleNo)) return res.status(405).send("Invalid vehicle number ...");
    try {
        // get amount from database
        const data = await User.find({ vn: req.params.vehicleNo }, { amount: 1 });
        if (data == null) return res.status(400).send("Invalid vehicle number ...");
        // pay amount
        const txPaymentId = await signPayment(req.body.xdr, data[0].amount);
        if (txPaymentId == null) return res.status(405).send("Transaction failed ...");
        // delete all data abount useramount
        const user = await User.findOneAndDelete({ vn: req.params.vehicleNo });
        if (!user) return res.status(404).send('The user with the given vehicle number was not found.');

        res.send({ "status": "success", "txId": txPaymentId });
    } catch (e) { console.error(e); res.status(400).send("Invalid vehicle number ...") }
});

// FUNCTION to sign transaction
const signEnterManageData = async txXDR => {
    const transaction = new Transaction(txXDR);
    const txDataName = transaction.operations[0].name;
    const txDataValue = transaction.operations[0].value;
    // is there vehicle no. correct?
    if (!(compareWithBuffer(camVehicleNo, txDataValue) === 0)) {
        throw new Error("Vehicle number from application is not correct");
    }
    const result = await submitTransaction(txXDR, txDataName.trim()); // then sign the tx
    return result.hash;
};
// FUNCTION to sign transaction
const signExitManageData = async (txXDR, txEnterId) => {
    // get $sourceID, mD(App.$appAccID), mD(App.$license) from txEnterId
    const txResult = await transactionViewer(txEnterId); // json
    // Node check is txEnterID valid ?
    if (!(txResult.source_account.trim() === nodeKeys.publicKey().trim())) {
        throw new Error(
            "CANNOT TRUSTED THIS TRANSACTION : not match source account"
        );
    }
    // get data from the txEnterID
    const tx_result = new Transaction(txResult.envelope_xdr);
    const txEnterDataName =
        tx_result.tx._attributes.operations[0]._attributes.body._value._attributes
            .dataName; // Buffer
    const txEnterDataValue =
        tx_result.tx._attributes.operations[0]._attributes.body._value._attributes
            .dataValue; // Buffer
    // read the xdr
    const transaction = new Transaction(txXDR);
    const txDataName = transaction.operations[0].name;
    const txDataValue = transaction.operations[0].value;
    // is transaction datavalue correct ?
    if (txDataValue) {
        throw new Error("Wrong operation's data in Transaction");
    }
    // is there vehicle no. correct?
    if (!(compareWithBuffer(camVehicleNo, txEnterDataValue) === 0)) {
        throw new Error("Vehicle number from application is not correct");
    }
    // is acc still the same ?
    if (!(compareWithBuffer(txDataName.trim(), txEnterDataName) === 0)) {
        throw new Error("account ID has been changed");
    }
    // then sign the tx
    // sign the trasaction
    const result = await submitTransaction(txXDR, txDataName);
    return result.hash;
};
// FUNCTION for sign transaction
const signPayment = async (txXDR, AMOUNT) => {
    // read the transaction
    const transaction = new Transaction(txXDR);
    const txDestinationAccId = transaction.operations[0].destination; // String
    const txAmount = transaction.operations[0].amount; // String->Number
    const txOperationSourceAccId = transaction.operations[0].source; // String
    // is app pay with native asset
    if (!(transaction.operations[0].asset.code.trim() === "XLM" &&
        !transaction.operations[0].asset.issuer
    )
    ) {
        throw new Error("Please Pay with native XLM");
    }
    // is app pay for Node ?
    if (!(nodeKeys.publicKey().trim() === txDestinationAccId.trim())) {
        throw new Error("Wrong Destination Id in Transaction", txDestinationAccId);
    }
    // is app pay with correct amount ?
    // AMOUNT for test only will replace by 'amount from calculateFee'
    if (!(txAmount === AMOUNT)) {
        throw new Error("Wrong amount in Transaction", txAmount);
    }
    // then sign the tx
    // sign the trasaction
    const result = await submitTransaction(txXDR, txOperationSourceAccId);
    return result.hash;
};
// FUNCTION for import transaction XDR -> sign the XDR w/t nodeSK
const submitTransaction = async (txXDR, appAccId) => {
    // isValid Account
    const nodeAcc = await server.loadAccount(nodeKeys.publicKey());
    if (!nodeAcc) {
        throw new Error("Invalid Node Account ID", nodeKeys.publicKey());
    }
    const appAcc = await server.loadAccount(appAccId);
    if (!appAcc) {
        throw new Error("Invalid Account ID", appAccId);
    }
    // check is App have native
    const appAccBalanceNative = appAcc.balances.find(
        item => item.asset_type === "native"
    );
    if (!appAccBalanceNative) {
        throw new Error("App Account does not have native balance");
    }
    // check is native >= 1
    const nativeBalance = Number(appAccBalanceNative.balance);
    const MAX_BALANCE_ALLOWANCE = 1;
    if (nativeBalance < MAX_BALANCE_ALLOWANCE) {
        throw new Error(`App Account must have balance > ${MAX_BALANCE_ALLOWANCE}`);
    }
    // create new transaction
    const tx = new StellarSdk.Transaction(txXDR);
    // sign transaction
    tx.sign(nodeKeys);
    // submit transaction
    return await server.submitTransaction(tx);
};
// FUNCTION for a string and a buffer
function compareWithBuffer(notBufYet, beBuff) {
    const buf = Buffer.from(notBufYet);
    // beBuff is already be a Buffer
    return buf.compare(beBuff); // return -1,0,1 but 0 if equal
}
// FUNCTION for view xdr
const transactionViewer = async txId => {
    return await server
        .transactions()
        .transaction(txId)
        .call();
};


module.exports = router;