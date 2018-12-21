const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

// ===============================A=P=P===============================
// params @BLEAccID from challenge-response
const blePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret('SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H');
const vehicleNo = '1กง6798';

// FUNCTION for create transaction envelope
async function createManageDataEnvelope(blePK) {
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
        value : vehicleNo
    }))
    //.addMemo(StellarSdk.Memo.text('entry'))
    .build()
    // create envelope
    const envelope = await tx.toEnvelope();
    return envelope;
}

// ===============================B=L=E===============================
// params from camera
const camVehicleNo = '1กง6798';
// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');

// FUNCTION to sign transaction
const signEnterManageData = async (envelope) => {
    const envelopeDataName = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataName;
    const envelopeDataValue = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataValue;
    // is there vehicle no. correct?
    if((compareWithBuffer(camVehicleNo, envelopeDataValue)) === 0 ) {
        const result = await submitTransaction(envelope, envelopeDataName); // then sign the tx
        return result.hash;
    }
    else console.log('Vehicle number from application is not correct');
}
// FUNCTION for a string and a buffer
function compareWithBuffer(notBufYet, beBuff) {
    const buf = Buffer.from(notBufYet);
    // beBuff is already be a Buffer
    return(buf.compare(beBuff)); // return -1,0,1 but 0 if equal
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

// ==============================T=E=S=T===============================
async function start() {
    // App create envelope
    const envelope = await createManageDataEnvelope(blePK); // then send "envelope" to BLE
    // BLE sign transaction
    const txEnterId = await signEnterManageData(envelope);
    console.log(txEnterId); // then send "txEnterId" back to App for store
}
start();


