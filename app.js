// import Stellar SDK
const StellarSdk = require('stellar-sdk')
// Use Testnet Server
StellarSdk.Network.useTestNetwork()
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')
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

// FUNCTION to create transaction 
const createPaymentTransaction = async (blePK, fee) => {
    // isValid Account
    const bleAcc = await server.loadAccount(blePK);
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
        destination : blePK,
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

// =====================================T=E=S=T=====================================
const start = async () => {
    // ==========ENTRY==========
    // App recieve "BLEAccID" from challenge-response
    const sourceKey = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
    // App create transaction
    let txXDR = await createManageDataXDR(sourceKey); 
    // App send "transaction XDR" to BLE
    // App wait
    // App recieve the txId back after summited to stellar
    const enterTxId = 'f19b9b09fa655243de8ede28c2e9e81e3f381a2406146d7e805dc929cdbede2c'
    // App Stored "enterTxId"
    // ==========EXIT==========
    // App recieve new "BLEAccID" from challenge-response
    const newBlePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
    // App compare that BLE acc still the same ?
    if(!(sourceKey.trim() === newBlePK.trim())) {
        throw new Error('CANNOT TRUSTED THIS ID: BLE Account ID \'s changed');
    }
    // App create transaction
    txXDR = await createManageDataXDR(newBlePK); 
    // App send "txXDR" & "enterTxId" to BLE
    // App wait
    // App receive "new BLEAccId" & "amount" from BLE
    const newestBlePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
    const amount = '0.4861111'
    // App compare that BLE acc still the same ?
    if(!(sourceKey.trim() === newestBlePK.trim())) {
        throw new Error('CANNOT TRUSTED THIS ID: BLE Account ID \'s changed');
    }
    // App create transaction
    txXDR = await createPaymentTransaction(newestBlePK, amount);
    // App send "txXDR" & "tx" to BLE
    // App wait
    // App recieve the receipt
}
start();