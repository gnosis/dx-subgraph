const { assert } = require('chai');
const axios = require('axios');
const delay = require('delay');
const { execSync, spawnSync } = require('child_process');
const TruffleContract = require('truffle-contract');
const { add } = require('bn.js');
const { log, error } = console;

const contracts = {
  TokenETH,
  TokenGNO,
  TokenFRT,
  TokenOWL,
  TokenOWLProxy,
  DutchExchange,
  Proxy,
  PriceOracleInterface,
  PriceFeed,
  Medianizer
};

const actualContracts = contracts.map(contractName => {
  con = TruffleContract.require(`@gnosis.pm/dx-contracts/build/contracts/${contractName}.json`);
  con.setProvider('http://localhost:8545');
  return con;
});

log(actualContracts);
log('DEPLOYED', actualContracts[0].deployed());

const web3 = actualContracts[0].web3;
const { randomHex, soliditySha3, toHex, toBN, padLeft, keccak256 } = web3.utils;

async function waitForGraphSync(targetBlockNumber) {
  if (targetBlockNumber == null) {
    targetBlockNumber = await web3.eth.getBlockNumber();
  }

  do {
    await delay(100);
  } while (
    (await axios.post('http://127.0.0.1:8000/subgraphs', {
      query: `{subgraphs(orderBy:createdAt orderDirection:desc where: {name: "Gnosis/GnosisMarkets"}) { versions { deployment { latestEthereumBlockNumber }} } }`
    })).data.data.subgraphs[0].versions[0].deployment.latestEthereumBlockNumber < targetBlockNumber
  );
}

describe('Complete scenario tests for accurate mappings', function() {});
