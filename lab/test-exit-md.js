const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

// ===============================A=P=P===============================
// params BLE Account ID from BLE challenge
const blePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret('SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H');
const vehicleNo = '1กง6798';

// FUNCTION to create transaction envelope
async function createEnvelope(blePK, vehicleNo) {
    // isValid Account
    const bleAcc = await server.loadAccount(blePK);
    if(!bleAcc) return console.log('Invalid BLE Account ID', blePK);
    const appAcc = await server.loadAccount(appKeys.publicKey());
    if(!appAcc) return console.log('Invalid Account ID');
    // check is App have native
    const appAccBalanceNaive = appAcc.balances.find(item => item.asset_type === 'native')
    if (!appAccBalanceNaive) {
        throw new Error('App Account does not have native balance')
    }
    // check is native >= 1
    const nativeBalance = Number(appAccBalanceNaive.balance)
    const MAX_BALANCE_ALLOWANCE = 1
    if (nativeBalance < MAX_BALANCE_ALLOWANCE) {
        throw new Error(`App Account must have balance > ${MAX_BALANCE_ALLOWANCE}`)
    }

    // create new transaction envelope
    const tx = new StellarSdk.TransactionBuilder(bleAcc)
    .addOperation(StellarSdk.Operation.manageData({
        name : appKeys.publicKey(),
        value : ''
    }))
    //.addMemo(StellarSdk.Memo.text('exit'))
    .build()

    // create envelope
    const envelope = await tx.toEnvelope();

    return envelope;
}
// FUNCTION for compare new-bleAccId with exist-bleAccId
function compareAccId(accId1, accId2){

}

// ===============================B=L=E===============================
// params enter's transaction hash from App response
const txEnterId = 'd34ad8f43a6f543e8c689ad4ef9644797791aec969b93183870fba0f1eee0f10'
// params from camera
const camVehicleNo = '1กง6798';
// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');

// FUNCTION to sign transaction
const signTransaction = async (envelope) => {
    const dataName = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataName;
    const dataValue = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataValue;
    // is there vehicle no. correct?
    if((compareVehicleNo(camVehicleNo, dataValue)) === 0 ) {
        const result = await submitTransaction(envelope, dataName); // then sign the tx
        return result.hash;
    }
    else console.log('Vehicle number from application is not correct');
}

// FUNCTION for compare camera's and app's
function compareVehicleNo(camVehicleNo, txVehicleNo) {
    const buf = Buffer.from(camVehicleNo);
    // txVehicle is already be a Buffer
    return(buf.compare(txVehicleNo));
}

// FUNCTION for compare account address
function compareAccId(accId1, accId2){

}

// FUNCTION for import envelope -> sign the envelope w/t bleSK
async function submitTransaction(envelope, appAccId) {
    // isValid Account
    const bleAcc = await server.loadAccount(blePK);
    if(!bleAcc) return console.log('Invalid BLE Account ID', blePK);
    const appAcc = await server.loadAccount(appAccId);
    if(!appAcc) return console.log('Invalid Account ID');
    // check is App have native
    const appAccBalanceNaive = appAcc.balances.find(item => item.asset_type === 'native')
    if (!appAccBalanceNaive) {
        throw new Error('App Account does not have native balance')
    }
    // check is native >= 1
    const nativeBalance = Number(appAccBalanceNaive.balance)
    const MAX_BALANCE_ALLOWANCE = 1
    if (nativeBalance < MAX_BALANCE_ALLOWANCE) {
        throw new Error(`App Account must have balance > ${MAX_BALANCE_ALLOWANCE}`)
    }

    // create new transaction
    const tx = new StellarSdk.Transaction(envelope)

    // sign envelope
    tx.sign(bleKeys);

    // submit transaction
    return await server.submitTransaction(tx);
}

// FUNCTION for get TIMESTAMP for calculate Fee
async function getTime(txId) {

}

// ==============================T=E=S=T===============================
async function start() {
    // App create envelope
    const envelope = await createEnvelope(blePK, vehicleNo);
    // BLE use txEnterId from App for get Timestamp, enter-dataName, enter-dataValue

    // then check information -> use enter-dataName to compare w/t exit-dataName, 
    //                               enter-dataValue to compare w/t camVehicleNo

    // BLE sign transaction
    const txExitId = await signTransaction(envelope);
    // BLE use txExitId for get Timestamp


}
start();


