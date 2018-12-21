const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

async function start() {
    txEnterId = 'd34ad8f43a6f543e8c689ad4ef9644797791aec969b93183870fba0f1eee0f10';
    const txresult = await viewTransaction(txEnterId);
    console.log(txresult);
}

async function viewTransaction(txId){
    return await server.transactions().transaction(txId).call();
}

start();