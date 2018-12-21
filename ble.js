// In case of test
// const tx = 

const appKey = 'GD5IDHIK6D6YHETVC5XYM4ENVTYVZINQRS3ZLXASSX4KEGG3QTHP6X7D';
const license = '1กง6798';

// import Stellar SDK
const StellarSdk = require('stellar-sdk')

// Use Testnet Server
StellarSdk.Network.useTestNetwork()
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

// params from camera
const camLicense = '1กง6798';

// BLE Store his data
const bleKeys = StellarSdk.Keypair.fromSecret('SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y');

function compare(camLicense, txLicense) {
    const buf1 = Buffer.from(camLicense);
    // const buf2 = Buffer.from(txLicense);
    return(buf1.compare(txLicense));
}

async function signTx(tx) {
    const source = await server.loadAccount(bleKeys.publicKey());
    if(!source) return console.log('Invalid Source Account ID');

    const appAcc = await server.loadAccount(tx.operations[0].name);
    if(!appAcc) return console.log('Invalid Application Account ID');

    // sign transaction
    tx.sign(bleKeys);

    // submit transaction
    const logs = await server.submitTransaction(tx);
    console.log(logs);
}

if((compare(camLicense, tx.operations[0].value))==0 ) signTx(tx);
else console.log('Wrong appLicense')
