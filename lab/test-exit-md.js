const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const {Transaction} = require('stellar-base'); // only BLE

// ===============================A=P=P===============================
// Account ID that stored from the begining
const oldBlePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// params @BLEAccID from challenge-response
const newBlePK = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret('SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H');
const vehicleNo = '1กง6798';

// FUNCTION for create transaction envelope
async function createManageDataEnvelope(newBlePK) {
    // is BLE acc still the same ?
    if(!compareAccID(oldBlePK, newBlePK)) {
        throw new Error('CANNOT TRUSTED THIS ID: BLE Account ID \'s changed')
    }
    // isValid Account
    const bleAcc = await server.loadAccount(newBlePK);
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
    .addOperation(StellarSdk.Operation.manageData({
        name : appKeys.publicKey(),
        value : null
    }))
    //.addMemo(StellarSdk.Memo.text('exit'))
    .build()
    // create envelope
    const envelope = await tx.toEnvelope();
    return envelope;
}

function compareAccID(accId1, accId2) {
    if(accId1.toString().trim() === accId2.toString().trim()) return true;
    return false;
}

// ===============================B=L=E===============================
// params from App
const txEnterId = 'f19b9b09fa655243de8ede28c2e9e81e3f381a2406146d7e805dc929cdbede2c'
// params from camera
const camVehicleNo = '1กง6798';
// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');

// FUNCTION to sign transaction
const signExitManageData = async (envelope, txEnterId) => {
    // get $sourceID, mD(App.$appAccID), mD(App.$license) from txEnterId
    const txResult = await transactionViewer(txEnterId); // json
    // BLE check is txEnterID valid ?
    const validateBLE = compareAccID(txResult.source_account, bleKeys.publicKey());
    if(!validateBLE) throw new Error('CANNOT TRUSTED THIS TRANSACTION : not match source account');
    // get data from the txEnterID
    const tx_result = new Transaction(txResult.envelope_xdr);
    const txEnterDataName = tx_result.tx._attributes.operations[0]._attributes.body._value._attributes.dataName; // Buffer
    const txEnterDataValue = tx_result.tx._attributes.operations[0]._attributes.body._value._attributes.dataValue; // Buffer
    // read the envelope
    const envelopeDataName = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataName;
    const envelopeDataValue = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataValue;
    // is transaction datavalue correct ?
    const isDataValueEmpty = isEmpty(envelopeDataValue);
    if(!isDataValueEmpty) throw new Error('Wrong operation\'s data in Transaction');
    // sign the trasaction
    if((compareWithBuffer(camVehicleNo, txEnterDataValue)) === 0 ) // is there vehicle no. correct?
        if((compareWithBuffer(envelopeDataName,txEnterDataName)) === 0) // is acc still the same ?
        {   // then sign the tx
            const result = await submitTransaction(envelope, envelopeDataName); 
            return result.hash;
        } else console.log('account ID has been changed');
    else console.log('Vehicle number from application is not correct');
}

// FUNCTION for a string and a buffer
function compareWithBuffer(notBufYet, beBuff) {
    const buf = Buffer.from(notBufYet);
    // beBuff is already be a Buffer
    return(buf.compare(beBuff)); // return -1,0,1 but 0 if equal
}

function isEmpty(dataValue) {
    if (dataValue === null) return true;
    return false;
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

// function compareAccID(accId1, accId2) {
//     if(accId1.toString().trim() === accId2.toString().trim()) return true;
//     return false;
// } 

async function transactionViewer(txId){
    return await server.transactions().transaction(txId).call();
}


// ==============================T=E=S=T===============================
async function start() {
    // App create envelope
    const envelope = await createManageDataEnvelope(newBlePK); //then send "envelope" & "enterTxId" to BLE
    // BLE sign manage data transaction
    const txExitId = await signExitManageData(envelope, txEnterId);
    console.log(txExitId);
}
start();


