const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const {Transaction} = require('stellar-base'); 

// ===============================A=P=P===============================
// params @BLEAccID from challenge-response
const blePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret('SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H');
const vehicleNo = '1กง6798';

// FUNCTION for create transaction XDR
const createManageDataXDR = async (blePK) => {
    // isValid Account
    const bleAcc = await server.loadAccount(blePK);
    if(!bleAcc) {
        throw new Error('Invalid BLE Account ID', blePK);
    }
    const appAcc = await server.loadAccount(appKeys.publicKey());
    if(!appAcc) {
        throw new Error('Invalid Account ID', appKeys.publicKey());
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
    // create new transaction XDR
    const tx = new StellarSdk.TransactionBuilder(bleAcc)
    .addOperation(StellarSdk.Operation.manageData({
        name : appKeys.publicKey(),
        value : vehicleNo
    }))
    //.addMemo(StellarSdk.Memo.text('entry'))
    .build()
    // create XDR
    const txXDR = await tx.toEnvelope().toXDR().toString("base64");
    return txXDR;
}

// ===============================B=L=E===============================
// params from camera
const camVehicleNo = '1กง6798';
// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');

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

// ==============================T=E=S=T===============================
const start = async () => {
    // App create transaction
    const txXDR = await createManageDataXDR(bleKeys.publicKey()); // then send "transaction XDR" to BLE
    // BLE sign transaction
    const txEnterId = await signEnterManageData(txXDR);
    console.log(txEnterId); // then send "txEnterId" back to App for store
}
start();


