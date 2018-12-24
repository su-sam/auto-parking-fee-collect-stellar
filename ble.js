// import require lib
const StellarSdk = require('stellar-sdk');
const {Transaction} = require('stellar-base'); 
const moment = require('moment')
// Use Testnet Server
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');
// BLE recieve params from camera
const camVehicleNo = '1กง6798';

// FUNCTION to sign transaction
const signEnterManageData = async (txXDR) => {
    const transaction = new Transaction(txXDR);
    const txDataName = transaction.operations[0].name;
    const txDataValue = transaction.operations[0].value;
    // is there vehicle no. correct?
    if(!((compareWithBuffer(camVehicleNo, txDataValue)) === 0 )) {
        throw new Error('Vehicle number from application is not correct')
    }
    const result = await submitTransaction(txXDR, txDataName.trim()); // then sign the tx
    return result.hash;
}

// FUNCTION for a string and a buffer
function compareWithBuffer(notBufYet, beBuff) {
    const buf = Buffer.from(notBufYet);
    // beBuff is already be a Buffer
    return(buf.compare(beBuff)); // return -1,0,1 but 0 if equal
}

// FUNCTION for import transaction XDR -> sign the XDR w/t bleSK
const submitTransaction = async (txXDR, appAccId) => {
    // isValid Account
    const bleAcc = await server.loadAccount(bleKeys.publicKey());
    if(!bleAcc) {
        throw new Error('Invalid BLE Account ID', bleKeys.publicKey());
    }
    const appAcc = await server.loadAccount(appAccId);
    if(!appAcc) {
        throw new Error('Invalid Account ID', appAccId);
    }
    // check is App have native
    const appAccBalanceNative = appAcc.balances.find(item => item.asset_type === 'native');
    if (!appAccBalanceNative) {
        throw new Error('App Account does not have native balance');
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
    tx.sign(bleKeys);
    // submit transaction
    return await server.submitTransaction(tx);
}

// FUNCTION to sign transaction
const signExitManageData = async (txXDR, txEnterId) => {
    // get $sourceID, mD(App.$appAccID), mD(App.$license) from txEnterId
    const txResult = await transactionViewer(txEnterId); // json
    // BLE check is txEnterID valid ?
    if(!(txResult.source_account.trim() === bleKeys.publicKey().trim())) {
        throw new Error('CANNOT TRUSTED THIS TRANSACTION : not match source account');
    }
    // get data from the txEnterID
    const tx_result = new Transaction(txResult.envelope_xdr);
    const txEnterDataName = tx_result.tx._attributes.operations[0]._attributes.body._value._attributes.dataName; // Buffer
    const txEnterDataValue = tx_result.tx._attributes.operations[0]._attributes.body._value._attributes.dataValue; // Buffer
    // read the xdr
    const transaction = new Transaction(txXDR);
    const txDataName = transaction.operations[0].name;
    const txDataValue = transaction.operations[0].value;
    // is transaction datavalue correct ?
    if(txDataValue) {
        throw new Error('Wrong operation\'s data in Transaction');
    }
    // is there vehicle no. correct?
    if(!((compareWithBuffer(camVehicleNo, txEnterDataValue)) === 0 )){
        throw new Error ('Vehicle number from application is not correct');
    }
    // is acc still the same ? 
    if(!((compareWithBuffer(txDataName.trim(), txEnterDataName)) === 0 )) {
        throw new Error ('account ID has been changed');
    } 
    // then sign the tx
    // sign the trasaction
    const result = await submitTransaction(txXDR, txDataName); 
    return result.hash;
}

// FUNCTION for a string and a buffer
function compareWithBuffer(notBufYet, beBuff) {
    const buf = Buffer.from(notBufYet);
    // beBuff is already be a Buffer
    return(buf.compare(beBuff)); // return -1,0,1 but 0 if equal
}

// FUNCTION for import transaction -> sign the transaction w/t bleSK
const submitTransaction = async (txXDR, appAccId) => {
    // isValid Account
    const bleAcc = await server.loadAccount(bleKeys.publicKey());
    if(!bleAcc) {
        throw new Error('Invalid BLE Account ID', bleKeys.publicKey());
    }
    const appAcc = await server.loadAccount(appAccId);
    if(!appAcc) {
        throw new Error('Invalid Account ID', appAccId);
    }
    // check is App have native
    const appAccBalanceNative = appAcc.balances.find(item => item.asset_type === 'native');
    if (!appAccBalanceNative) {
        throw new Error('App Account does not have native balance');
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
    tx.sign(bleKeys);
    // submit transaction
    return await server.submitTransaction(tx);
}

// FUNCTION for view the transaction
const transactionViewer = async (txId) => {
    return await server.transactions().transaction(txId).call();
}

// FUNCTION for get timeStamp
const getTimestamp = async (txId) => {
    const tx_result = await transactionViewer(txId);
    return tx_result.created_at;
}

// FUNCTION for calculate fee
function calculateFee(enterTime, exitTime){
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
    let amount =hours*feePerHour;
    amount = amount.toPrecision(7);
    return amount.toString();
}

// FUNCTION for sign transaction
const signPayment = async (txXDR) => {
    // read the transaction
    const transaction = new Transaction(txXDR);
    const txDestinationAccId = transaction.operations[0].destination; // String
    const txAmount = Number(transaction.operations[0].amount); // String->Number
    const txOperationSourceAccId = transaction.operations[0].source; // String
    // is app pay with native asset
    if(!((transaction.operations[0].asset.code.trim() === 'XLM')&&(!transaction.operations[0].asset.issuer))){
        throw new Error ('Please Pay with native XLM');
    }
    // is app pay for BLE ?
    if(!(bleKeys.publicKey().trim() === txDestinationAccId.trim())){
        throw new Error ('Wrong Destination Id in Transaction', txDestinationAccId);
    }
    // is app pay with correct amount ?
    // AMOUNT for test only will replace by 'amount from calculateFee'
    if(!(txAmount === AMOUNT)) {
        throw new Error ('Wrong amount in Transaction', txAmount);
    }
    // then sign the tx
    // sign the trasaction
    const result = await submitTransaction(txXDR, txOperationSourceAccId); 
    return result.hash;
}

// =====================================T=E=S=T=====================================
const start = async () => {
    // ==========ENTRY==========
    // BLE challenge App and send "BLEAccId"
    // BLE wait
    // BLE recieve "transaction XDR" from App
    // BLE sign transaction
    const txEnterId = await signEnterManageData(txXDR);
    // BLE send "txEnterId" to App
    // ==========EXIT==========
    // BLE challenge App and send "BLEAccId"
    // BLE wait
    // BLE recieve "txXDR" & "enterTxId" to BLE
    // BLE sign manage data transaction
    const txExitId = await signExitManageData(txXDR, txEnterId);
    // BLE get time stamp
    const enterTimestamp = await getTimestamp(txEnterId);
    const exitTimestamp = await getTimestamp(txExitId);
    // BLE calculate fee
    const amount = calculateFee(enterTimestamp, exitTimestamp); 
    // BLE send "BLEAccId" & "amount" to App
    // BLE wait
    // BLE sign manage data transaction
    const txPaymentId = await signPayment(txXDR);
    // BLE create receipt and send it to App
}
start();