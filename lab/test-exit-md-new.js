const StellarSdk = require("stellar-sdk");
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
const { Transaction } = require("stellar-base");

// =============================== App ===============================
// Account ID that stored from the begining
const oldNodePK = "GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM";
// params @NodeAccID from challenge-response
const newNodePK = "GC3VDJXZKI6JK6Q5LL5AHS6LXVDQG5T6LDGLYJADDIDYXLN2EPUYRBKM";
// App Store his data
const appKeys = StellarSdk.Keypair.fromSecret(
  "SBSFFFZP53H37E7RFWSVPRG3JE3BMQT25HLIOQOBCTPY5RKJVG6GFQ4H"
);
const vehicleNo = "1กง6798";

// FUNCTION for create transaction xdr
const createManageDataXDR = async newNodePK => {
  // is Node acc still the same ?
  if (!(oldNodePK.trim() === newNodePK.trim())) {
    throw new Error("CANNOT TRUSTED THIS ID: Node Account ID 's changed");
  }
  // isValid Account
  const nodeAcc = await server.loadAccount(newNodePK);
  if (!nodeAcc) {
    throw new Error("Invalid Node Account ID", newNodePK);
  }
  const appAcc = await server.loadAccount(appKeys.publicKey());
  if (!appAcc) {
    throw new Error("Invalid Account ID", publicKey);
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
  // create new transaction xdr
  const tx = new StellarSdk.TransactionBuilder(nodeAcc)
    .addOperation(
      StellarSdk.Operation.manageData({
        name: appKeys.publicKey(),
        value: null
      })
    )
    //.addMemo(StellarSdk.Memo.text('exit'))
    .build();
  // create transactin XDR
  const txXDR = await tx
    .toEnvelope()
    .toXDR()
    .toString("base64");
  return txXDR;
};

// =============================== Node ===============================
// params from App
const txEnterId =
  "b0efe2fa738805bd1789b57db93318314beeb68e608f743ca57fa27eb6b6fad7";
// params from camera
const camVehicleNo = "1กง6798";
// Node Store his data
const nodeKeys = StellarSdk.Keypair.fromSecret(
  "SCMWGMAIPDRXWYDMSFXSOJO5NQ2DXSSTQYAT3FQ67M2GSRMCNAYUHU5Y"
);

// FUNCTION to sign transaction
const signExitManageData = async (txXDR, txEnterId) => {
  // get $sourceID, mD(App.$appAccID), mD(App.$license) from txEnterId
  const txResult = await transactionViewer(txEnterId); // json
  // Node check is txEnterID valid ?
  if (!(txResult.source_account.trim() === nodeKeys.publicKey().trim())) {
    throw new Error(
      "CANNOT TRUSTED THIS TRANSACTION : not match source account"
    );
  }
  // get data from the txEnterID
  const tx_result = new Transaction(txResult.envelope_xdr);
  const txEnterDataName =
    tx_result.tx._attributes.operations[0]._attributes.body._value._attributes
      .dataName; // Buffer
  const txEnterDataValue =
    tx_result.tx._attributes.operations[0]._attributes.body._value._attributes
      .dataValue; // Buffer
  // read the xdr
  const transaction = new Transaction(txXDR);
  const txDataName = transaction.operations[0].name;
  const txDataValue = transaction.operations[0].value;
  // is transaction datavalue correct ?
  if (txDataValue) {
    throw new Error("Wrong operation's data in Transaction");
  }
  // is there vehicle no. correct?
  if (!(compareWithBuffer(camVehicleNo, txEnterDataValue) === 0)) {
    throw new Error("Vehicle number from application is not correct");
  }
  // is acc still the same ?
  if (!(compareWithBuffer(txDataName.trim(), txEnterDataName) === 0)) {
    throw new Error("account ID has been changed");
  }
  // then sign the tx
  // sign the trasaction
  const result = await submitTransaction(txXDR, txDataName);
  return result.hash;
};
// FUNCTION for a string and a buffer
function compareWithBuffer(notBufYet, beBuff) {
  const buf = Buffer.from(notBufYet);
  // beBuff is already be a Buffer
  return buf.compare(beBuff); // return -1,0,1 but 0 if equal
}
// FUNCTION for import transaction -> sign the transaction w/t nodeSK
const submitTransaction = async (txXDR, appAccId) => {
  // isValid Account
  const nodeAcc = await server.loadAccount(nodeKeys.publicKey());
  if (!nodeAcc) {
    throw new Error("Invalid Node Account ID", nodeKeys.publicKey());
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
  // App create transaction XDR
  const txXDR = await createManageDataXDR(newNodePK); //then send "txXDR" & "enterTxId" to Node
  // Node sign manage data transaction
  const txExitId = await signExitManageData(txXDR, txEnterId);
  console.log(txExitId);
};
start();
