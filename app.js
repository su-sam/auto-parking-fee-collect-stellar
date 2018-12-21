// import Stellar SDK
const StellarSdk = require('stellar-sdk')

// Use Testnet Server
StellarSdk.Network.useTestNetwork()
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

// params @BLEAccID from challenge-response
const sourceKey = 'GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM';

// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret('SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H');
const license = '1กง6798';

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
    console.log(typeof envelope)

    // envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataName
    // envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.dataValue
}

createTx(sourceKey, license);