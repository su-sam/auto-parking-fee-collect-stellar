const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const {Transaction} = require('stellar-base'); // only BLE

// ===============================A=P=P===============================
// Account ID that stored
const existingBlePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// params @BLEAccID from challenge-response + amount
const enteringBlePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret('SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H');
const vehicleNo = '1กง6798'; // not use

// FUNCTION to create transaction envelope
async function createPaymentEnvelope(enteringBlePK, fee) {
    // is BLE acc still the same ?
    if(!compareAccID(existingBlePK, enteringBlePK)) {
        throw new Error('CANNOT TRUSTED THIS ID: BLE Account ID \'s changed')
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
    .addOperation(StellarSdk.Operation.payment({
        destination : enteringBlePK,
        asset : StellarSdk.Asset.native(),
        amount : "100",
        // amount : fee,
        source : appKeys.publicKey()
    }))
    //.addMemo(StellarSdk.Memo.text('payment'))
    .build()
    // 1st signer
    // tx.sign(appKeys);
    // create envelope
    const envelope = await tx.toEnvelope();
    return envelope;
}

function compareAccID(accId1, accId2) {
    if(accId1.toString().trim() === accId2.toString().trim()) return true;
    return false;
}

// ===============================B=L=E===============================
// for test
const AMOUNT = 100;
// params that BLE already knew
const txEnterId = 'df89307c5c7e841b2220da2f8a2514aa869979455e0955032322c08a0bc1e53f'; // from app
const txExitId = '3505db1646a35bfee238b2e22e4aa37142f324a45daae8d57ff96cb6bd2e5f93'; // from last submited 
// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');
// FUNCTION for get timeStamp
async function getTimestamp(txId){
    const tx_result = await transactionViewer(txId);
    return tx_result.created_at;

}
// FUNCTION for calculate fee
function calculateFee(enterTime, exitTime){
    // timestamp duration
    console.log(enterTime);
    console.log(exitTime);
    const amount =100;

    return amount.toString();
}
// FUNCTION for sign transaction
const signPayment = async (envelope) => {
    // read the envelope
    const envelopeDestinationAccId = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.destination._value; // Buffer
    const envelopeAmount = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.amount.low; // Number
    const assetType = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.asset._switch.name; // String
    const envelopeOperationSourceAccId = envelope._attributes.tx._attributes.operations[0]._attributes.sourceAccount._value; // Buffer
    // is app pay with native asset
    if(!(assetType === 'assetTypeNative')) throw new Error('Please pay with native XLM');
    // sign the trasaction
    if((compareWithBuffer(bleKeys.publicKey(), envelopeDestinationAccId)) === 0 ) // is app pay foe BLE ?
        if(envelopeAmount/10000000 === AMOUNT) // is app pay with correct amount ?
        {   // then sign the tx
            const result = await submitTransaction(envelope, envelopeOperationSourceAccId); 
            return result.hash;
        } else console.log('Wrong amount in Transaction', envelopeAmount);
    else console.log('Wrong Destination Id in Transaction', envelopeDestinationAccId);
}
// FUNCTION for import envelope -> sign the envelope w/t bleSK
async function submitTransaction(envelope, appAccId) {
    // isValid Account
    const bleAcc = await server.loadAccount(bleKeys.publicKey());
    if(!bleAcc) return console.log('Invalid BLE Account ID', bleKeys.publicKey);
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

async function transactionViewer(txId){
    return await server.transactions().transaction(txId).call();
}
// FUNCTION for a string and a buffer
function compareWithBuffer(notBufYet, beBuff) {
    const buf = Buffer.from(notBufYet);
    console.log(notBufYet);
    console.log(buf);
    console.log(beBuff);
    // beBuff is already be a Buffer
    return(buf.compare(beBuff)); // return -1,0,1 but 0 if equal
}

// ==============================T=E=S=T===============================
async function start() {
    // BLE get time stamp
    const enterTimestamp = await getTimestamp(txEnterId);
    const exitTimestamp = await getTimestamp(txExitId);
    const amount = calculateFee(enterTimestamp, exitTimestamp); //then send "amount" & "accId" to App
    // App create envelope
    const envelope = await createPaymentEnvelope(enteringBlePK, amount);
    // for debug
    debugger
    console.log(envelope);
    // BLE sign manage data transaction
    const txPaymentId = await signPayment(envelope);
    console.log(txPaymentId);
}
start();


