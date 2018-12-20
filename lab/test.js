const StellarSdk = require('stellar-sdk')
StellarSdk.Network.useTestNetwork()
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

// ===============================A=P=P===============================
// params @BLEAccID from challenge-response
const sourceKey = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret('SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H');
const license = '1กง6798';
// create tx
async function createTx(sourceKey, license) {
    const source = await server.loadAccount(sourceKey);
    if(!source) return console.log('Invalid Source Account ID');

    const appAcc = await server.loadAccount(appKeys.publicKey());
    if(!appAcc) return console.log('Invalid Application Account ID');

    // create transaction envelope
    const tx = new StellarSdk.TransactionBuilder(source)
    .addOperation(StellarSdk.Operation.manageData({
        name : appKeys.publicKey(),
        value : license
    }))
    //.addMemo(StellarSdk.Memo.text(license))
    .build()

    const envelope = await tx.toEnvelope();
    //console.log(envelope)
    return envelope;
    // envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataName
    // envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataValue
}

// ===============================B=L=E===============================
// params from camera
const camLicense = '1กง6798';
// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');

async function start() {
    // for test
    const envelope = await createTx(appKeys.publicKey(), license);
        // console.log(envelope);
    const dataName = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataName;
    const dataValue = envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataValue;
        // console.log(dataName);
        // console.log(dataValue);
    if((compare(camLicense, dataValue))==0 ) //console.log(envelope.toXDR('base64')) //console.log('true')
        await signTx(envelope, dataName);
    else console.log('Wrong License from application')
}

function compare(camLicense, txLicense) {
    const buf1 = Buffer.from(camLicense);
    // const buf2 = Buffer.from(txLicense);
    return(buf1.compare(txLicense));
}

async function signTx(envelope, appAccId) {
    const source = await server.loadAccount(bleKeys.publicKey());
    if(!source) return console.log('Invalid Source Account ID');

    const appAcc = await server.loadAccount(appAccId);
    if(!appAcc) return console.log('Invalid Application Account ID');

    console.log(envelope);
    const tx = new StellarSdk.Transaction(envelope)
    // // import the XDR 
    // const tx = new StellarSdk.Transaction(encodeEnvelope);
    // // sign transaction
    tx.sign(bleKeys);
    // // submit transaction

    try {
        await server.submitTransaction(tx);
    } catch(e) {
        console.log('error when sumit tx: ', e)
    }
    

    // console.log(logs);
}

start();

