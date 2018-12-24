const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const {Transaction} = require('stellar-base');
const moment = require('moment');

// ===============================A=P=P===============================
// Account ID that stored
const existingBlePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// params @BLEAccID from challenge-response + amount
const enteringBlePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret('SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H');
const vehicleNo = '1กง6798'; // not use


// FUNCTION to create transaction 
const createPaymentTransaction = async (enteringBlePK, fee) => {
    // is BLE acc still the same ?
    if(!(existingBlePK.trim() === enteringBlePK.trim())) {
        throw new Error('CANNOT TRUSTED THIS ID: BLE Account ID \'s changed');
    }
    // isValid Account
    const bleAcc = await server.loadAccount(enteringBlePK);
    if(!bleAcc) {
        throw new Error('Invalid BLE Account ID');
    } 
    const appAcc = await server.loadAccount(appKeys.publicKey());
    if(!appAcc) {
        throw new Error('Invalid Account ID');
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
    const tx = new StellarSdk.TransactionBuilder(bleAcc)
    .addOperation(StellarSdk.Operation.payment({
        destination : enteringBlePK,
        asset : StellarSdk.Asset.native(),
        amount : fee,
        source : appKeys.publicKey()
    }))
    //.addMemo(StellarSdk.Memo.text('payment'))
    .build()
    // 1st signer
    tx.sign(appKeys);
    // return transaction
    const txXDR = await tx.toEnvelope().toXDR().toString("base64");
    return txXDR;
}

// ===============================B=L=E===============================
// for test
const AMOUNT = 0.4861111;
// params that BLE already knew
const txEnterId = 'df89307c5c7e841b2220da2f8a2514aa869979455e0955032322c08a0bc1e53f'; // from app
const txExitId = '3505db1646a35bfee238b2e22e4aa37142f324a45daae8d57ff96cb6bd2e5f93'; // from last submited 
// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');
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
// FUNCTION for import transaction -> sign the transaction w/t bleSK
const submitTransaction = async (txXDR, appAccId) => {
    // isValid Account
    const bleAcc = await server.loadAccount(bleKeys.publicKey());
    if(!bleAcc) {
        throw new Error('Invalid BLE Account ID', bleKeys.publicKey);
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
const transactionViewer = async (txId) => {
    return await server.transactions().transaction(txId).call();
}

// ==============================T=E=S=T===============================
const start = async () => {
    // BLE get time stamp
    const enterTimestamp = await getTimestamp(txEnterId);
    const exitTimestamp = await getTimestamp(txExitId);
    const amount = calculateFee(enterTimestamp, exitTimestamp); 
    //then send "BLEAccId" & "amount" to App
    // App create transaction
    const tx = await createPaymentTransaction(enteringBlePK, amount);
    // BLE sign manage data transaction
    const txPaymentId = await signPayment(tx);
    console.log(txPaymentId);
}
start();


