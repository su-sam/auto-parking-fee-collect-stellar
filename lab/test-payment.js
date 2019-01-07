const StellarSdk = require("stellar-sdk");
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
const { Transaction } = require("stellar-base");
const moment = require("moment");

// =============================== App ===============================
// Account ID that stored
const existingNodePK =
  "GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM";
// params @NodeAccID from challenge-response + amount
const enteringNodePK =
  "GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM";
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret(
  "SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H"
);
const vehicleNo = "1กง6798"; // not use

// FUNCTION to create transaction
const createPaymentTransaction = async (enteringNodePK, fee) => {
  // is Node acc still the same ?
  if (!(existingNodePK.trim() === enteringNodePK.trim())) {
    throw new Error("CANNOT TRUSTED THIS ID: Node Account ID 's changed");
  }
  // isValid Account
  const nodeAcc = await server.loadAccount(enteringNodePK);
  if (!nodeAcc) {
    throw new Error("Invalid Node Account ID");
  }
  const appAcc = await server.loadAccount(appKeys.publicKey());
  if (!appAcc) {
    throw new Error("Invalid Account ID");
  }
  // check is App have native
  const appAccBalanceNative = appAcc.balances.find(
    item => item.asset_type === "native"
  );
  if (!appAccBalanceNative) {
    throw new Error("App Account does not have native balance");
  }
  // check is native >= 1
  const nativeBalance = Number(appAccBalanceNative.balance);
  const MAX_BALANCE_ALLOWANCE = 1;
  if (nativeBalance < MAX_BALANCE_ALLOWANCE) {
    throw new Error(`App Account must have balance > ${MAX_BALANCE_ALLOWANCE}`);
  }
  // create new transaction
  const tx = new StellarSdk.TransactionBuilder(nodeAcc)
    .addOperation(
      StellarSdk.Operation.payment({
        destination: enteringNodePK,
        asset: StellarSdk.Asset.native(),
        amount: fee,
        source: appKeys.publicKey()
      })
    )
    //.addMemo(StellarSdk.Memo.text('payment'))
    .build();
  // 1st signer
  tx.sign(appKeys);
  // return transaction
  const txXDR = await tx
    .toEnvelope()
    .toXDR()
    .toString("base64");
  return txXDR;
};

// =============================== Node ===============================
// for test
const AMOUNT = 0.8847222;
// params that Node already knew
const txEnterId =
  "b0efe2fa738805bd1789b57db93318314beeb68e608f743ca57fa27eb6b6fad7"; // from app
const txExitId =
  "965d751cc1c21b1615825fbeb80c0e38553830393316cd1a9aeb8e39544bee56"; // from last submited
// Node Store his data
const nodeKeys = StellarSdk.Keypair.fromSecret(
  "SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y"
);

// FUNCTION for get timeStamp
const getTimestamp = async txId => {
  const tx_result = await transactionViewer(txId);
  return tx_result.created_at;
};
// FUNCTION for calculate fee
function calculateFee(enterTime, exitTime) {
  // timestamp duration
  const startTime = moment(enterTime);
  const endTime = moment(exitTime);
  // different millisec
  const diff = endTime.diff(startTime);
  const duration = moment.duration(diff);
  // how long user park
  const hours = duration.asHours();
  // fee rate
  const feePerHour = 35;
  // calculate fee
  let amount = hours * feePerHour;
  amount = amount.toPrecision(7);
  return amount.toString();
}
// FUNCTION for sign transaction
const signPayment = async txXDR => {
  // read the transaction
  const transaction = new Transaction(txXDR);
  const txDestinationAccId = transaction.operations[0].destination; // String
  const txAmount = Number(transaction.operations[0].amount); // String->Number
  const txOperationSourceAccId = transaction.operations[0].source; // String
  // is app pay with native asset
  if (
    !(
      transaction.operations[0].asset.code.trim() === "XLM" &&
      !transaction.operations[0].asset.issuer
    )
  ) {
    throw new Error("Please Pay with native XLM");
  }
  // is app pay for Node ?
  if (!(nodeKeys.publicKey().trim() === txDestinationAccId.trim())) {
    throw new Error("Wrong Destination Id in Transaction", txDestinationAccId);
  }
  // is app pay with correct amount ?
  // AMOUNT for test only will replace by 'amount from calculateFee'
  if (!(txAmount === AMOUNT)) {
    throw new Error("Wrong amount in Transaction", txAmount);
  }
  // then sign the tx
  // sign the trasaction
  const result = await submitTransaction(txXDR, txOperationSourceAccId);
  return result.hash;
};
// FUNCTION for import transaction -> sign the transaction w/t NodeSK
const submitTransaction = async (txXDR, appAccId) => {
  // isValid Account
  const nodeAcc = await server.loadAccount(nodeKeys.publicKey());
  if (!nodeAcc) {
    throw new Error("Invalid Node Account ID", nodeKeys.publicKey);
  }
  const appAcc = await server.loadAccount(appAccId);
  if (!appAcc) {
    throw new Error("Invalid Account ID", appAccId);
  }
  // check is App have native
  const appAccBalanceNative = appAcc.balances.find(
    item => item.asset_type === "native"
  );
  if (!appAccBalanceNative) {
    throw new Error("App Account does not have native balance");
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
  tx.sign(nodeKeys);
  // submit transaction
  return await server.submitTransaction(tx);
};
const transactionViewer = async txId => {
  return await server
    .transactions()
    .transaction(txId)
    .call();
};

// ==============================T=E=S=T===============================
const start = async () => {
  // Node get time stamp
  const enterTimestamp = await getTimestamp(txEnterId);
  const exitTimestamp = await getTimestamp(txExitId);
  // Node calculate fee
  const amount = calculateFee(enterTimestamp, exitTimestamp);
  // then send "NodeAccId" & "amount" to App
  // App create transaction
  const txXDR = await createPaymentTransaction(enteringNodePK, amount);
  // Node sign manage data transaction
  const txPaymentId = await signPayment(txXDR);
  console.log(txPaymentId);
};
start();
