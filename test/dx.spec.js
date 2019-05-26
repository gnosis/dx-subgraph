/* global artifacts, contract, it */
/* eslint no-undef: "error" */
const { assert } = require('chai');
const axios = require('axios');
const delay = require('delay');
const { add } = require('bn.js');
const _ = require('lodash');

const {
  eventWatcher,
  log: utilsLog,
  assertRejects,
  timestamp,
  gasLogger,
  auctionId,
  tokenPairId,
  tokenBalanceId,
  tokenAuctionBalanceId,
  wait
} = require('./utils');
const {
  getContracts,
  setupTest,
  getClearingTime,
  setAndCheckAuctionStarted,
  getAuctionIndex
} = require('./testFunctions');
const { randomHex, soliditySha3, toHex, toBN, padLeft, keccak256, toWei, fromWei } = web3.utils;
const TokenGNO = artifacts.require('TokenGNO');
const DutchExchangeProxy = artifacts.require('DutchExchangeProxy');

const separateLogs = () => utilsLog('\n    ----------------------------------');
const log = (...args) => utilsLog('\t', ...args);
log('currentProvider', web3.currentProvider);

async function waitForGraphSync(targetBlockNumber) {
  if (targetBlockNumber == null) {
    targetBlockNumber = await web3.eth.getBlockNumber();
  }
  do {
    await delay(100);
  } while (
    (await axios.post('http://127.0.0.1:8000/subgraphs', {
      query: `{subgraphs(orderBy:createdAt orderDirection:desc where: {name: "Gnosis/DutchX"}) { versions { deployment { latestEthereumBlockNumber }} } }`
    })).data.data.subgraphs[0].versions[0].deployment.latestEthereumBlockNumber < targetBlockNumber
  );
}

// Test Variables
let eth;
let gno, gno2;
let mgn;
let dx;
let oracle;
let feeRatio;
let contracts, symbols;

contract('DutchExchange', accounts => {
  const [master, seller1, seller2, buyer1, buyer2] = accounts;

  before(async () => {
    // get contracts
    contracts = await getContracts();
    contracts.gno2 = await TokenGNO.new(toBN(toWei('100000')), { from: master });
    // destructure contracts into upper state
    ({
      EtherToken: eth,
      TokenGNO: gno,
      TokenFRT: mgn,
      DutchExchange: dx,
      PriceOracleInterface: oracle,
      gno2: gno2
    } = contracts);

    await setupTest([master, seller1, seller2, buyer1, buyer2], contracts, {});

    // const totalMgn = (await mgn.totalSupply.call()).toNumber();
    // assert.strictEqual(totalMgn, 0, 'total MGN tokens should be 0');
    // then we know that feeRatio = 1 / 200
    feeRatio = 1 / 200;

    addTokenPairDefaults = {
      token1: eth.address,
      token2: gno.address,
      token1Funding: toBN(toWei('10000')),
      token2Funding: toBN(toWei('1500')),
      initialClosingPriceNum: 2,
      initialClosingPriceDen: 1
    };

    // a new deployed GNO to act as a different token

    // await Promise.all([
    //   gno2.transfer(seller1, startBal.startingGNO, { from: master }),
    //   gno2.approve(dx.address, startBal.startingGNO, { from: seller1 })
    // ]);
    // await dx.deposit(gno2.address, startBal.startingGNO, { from: seller1 });

    symbols = {
      [eth.address]: 'ETH',
      [gno.address]: 'GNO',
      [gno2.address]: 'GNO2'
    };
  });

  it('DutchExchange', async () => {
    await waitForGraphSync();

    // Assert that the tokens have been properly deposited
    let depositData = (await axios.post('http://127.0.0.1:8000/subgraphs/name/Gnosis/DutchX', {
      query:
        '{tokens { id traders { id }} traders { id } deposits { id amount trader { id } token { id } } tokenBalances { id trader { id } totalDeposited totalWithdrawn balance}}'
    })).data.data;
    assert.equal(depositData.traders.length, 4);
    assert.sameMembers(
      depositData.traders.map(trader => trader.id),
      [seller1, seller2, buyer1, buyer2].map(m => m.toLowerCase())
    );
    assert.equal(depositData.tokens.length, 3);
    for (var token of depositData.tokens) {
      assert.equal(token.traders.length, 4);
      assert.includeMembers(
        accounts.slice(1, 5).map(member => member.toLowerCase()),
        token.traders.map(trader => trader.id)
      );
    }
    assert.sameMembers(
      depositData.tokens.map(token => token.id),
      [gno.address, gno2.address, eth.address].map(member => member.toLowerCase())
    );
    assert.equal(depositData.deposits.length, 12);
    for (const [depositTrader, deposiAmount, depositToken] of depositData.deposits.map(deposit => [
      deposit.trader.id,
      deposit.amount,
      deposit.token.id
    ])) {
      assert.include(accounts.slice(1, 5).map(acc => acc.toLowerCase()), depositTrader);
      assert.include(
        [gno.address, gno2.address, eth.address].map(acc => acc.toLowerCase()),
        depositToken
      );
      assert.isAtLeast(_.toNumber(deposiAmount), _.toNumber(toWei('10000')));
      assert.isAtMost(_.toNumber(deposiAmount), _.toNumber(toWei('20000')));
    }

    await addTokenPair(seller1);
    await waitForGraphSync();
    const tokenOrder = await dx.getTokenOrder(eth.address, gno.address);
    const tokenPair = tokenPairId(tokenOrder['0'], tokenOrder['1']);
    const auctionId1 = auctionId(eth.address, gno.address, 1);
    const auctionId2 = auctionId(gno.address, eth.address, 1);
    const tokenBalance1 = tokenBalanceId(seller1, eth.address);
    const tokenBalance2 = tokenBalanceId(seller1, gno.address);
    const tokenBalance3 = tokenBalanceId(seller1, gno2.address);
    const tokenAuctionBalanceId1 = tokenAuctionBalanceId(seller1, auctionId1);
    const tokenAuctionBalanceId2 = tokenAuctionBalanceId(seller1, auctionId2);
    const latestBlock = await web3.eth.getBlock('latest');

    let addTokenPairData = (await axios.post('http://127.0.0.1:8000/subgraphs/name/Gnosis/DutchX', {
      query: `{trader(id: "${seller1.toLowerCase()}") { id firstParticipation sellOrders { id } buyOrders { id } tokenPairsParticipated { id } tokensParticipated { id } tokenAuctionBalances { id } lastActive } tokenPair(id: "${tokenPair}") { id token1 token2 currentAuctionIndex traders { id } latestStartTime } auction(id: "${auctionId2}") { id sellToken buyToken sellVolume buyVolume cleared startTime tokenPair { id } sellOrders { id } buyOrders { id }} sellOrders { id } tokenBalances { id balance} tokenAuctionBalances { id sellTokenBalance trader { id } auction { id cleared startTime }}}`
    })).data.data;

    assert.equal(addTokenPairData.trader.firstParticipation, latestBlock.timestamp.toString());
    assert.equal(addTokenPairData.trader.lastActive, latestBlock.timestamp.toString());
    assert.lengthOf(addTokenPairData.trader.sellOrders, 2);
    assert.lengthOf(addTokenPairData.trader.buyOrders, 0);
    assert.lengthOf(addTokenPairData.trader.tokenAuctionBalances, 2);
    assert.lengthOf(addTokenPairData.trader.tokenPairsParticipated, 1);
    assert.lengthOf(addTokenPairData.trader.tokensParticipated, 3);

    assert.equal(addTokenPairData.tokenPair.currentAuctionIndex, 1);
    assert.equal(addTokenPairData.tokenPair.token1, tokenOrder['0'].toLowerCase());
    assert.equal(addTokenPairData.tokenPair.token2, tokenOrder['1'].toLowerCase());
    assert.lengthOf(addTokenPairData.tokenPair.traders, 1);

    for (const [auction, sellTokenBalance, trader] of _.filter(
      addTokenPairData.tokenAuctionBalances,
      { id: tokenAuctionBalanceId1 }
    ).map(tokenAuctionBalance => [
      tokenAuctionBalance.auction,
      tokenAuctionBalance.sellTokenBalance,
      tokenAuctionBalance.trader
    ])) {
      assert.equal(auction.id, auctionId1);
      log('start time ', auction.startTime);
      assert.equal(auction.cleared, false);
      assert.equal(fromWei(sellTokenBalance), '9950');
      assert.equal(trader.id, seller1.toLowerCase());
    }
    for (const [auction, sellTokenBalance, trader] of _.filter(
      addTokenPairData.tokenAuctionBalances,
      { id: tokenAuctionBalanceId2 }
    ).map(tokenAuctionBalance => [
      tokenAuctionBalance.auction,
      tokenAuctionBalance.sellTokenBalance,
      tokenAuctionBalance.trader
    ])) {
      assert.equal(auction.id, auctionId2);
      assert.equal(auction.cleared, false);
      assert.equal(fromWei(sellTokenBalance), (1500 - 1500 * feeRatio).toString());
      assert.equal(trader.id, seller1.toLowerCase());
    }

    for (const [balance] of _.filter(addTokenPairData.tokenBalances, { id: tokenBalance1 }).map(
      tokenBalance => [tokenBalance.balance]
    )) {
      assert.equal(fromWei(balance), 0);
    }
    for (const [balance] of _.filter(addTokenPairData.tokenBalances, { id: tokenBalance2 }).map(
      tokenBalance => [tokenBalance.balance]
    )) {
      assert.equal(fromWei(balance), 8500);
    }
    for (const [balance] of _.filter(addTokenPairData.tokenBalances, { id: tokenBalance3 }).map(
      tokenBalance => [tokenBalance.balance]
    )) {
      assert.equal(fromWei(balance), 20000);
    }
    // await setAndCheckAuctionStarted();
    log(addTokenPairData.auction.starTime);
    log(latestBlock.timestamp);

    // End of tessts
  });
});

// Helper functions
const addTokenPair = (account, options) => {
  options = { ...addTokenPairDefaults, ...options };
  options.token1 = options.token1.address || options.token1;
  options.token2 = options.token2.address || options.token2;

  const {
    token1,
    token2,
    token1Funding,
    token2Funding,
    initialClosingPriceNum,
    initialClosingPriceDen
  } = options;

  return dx.addTokenPair(
    token1.address || token1,
    token2.address || token2,
    token1Funding,
    token2Funding,
    initialClosingPriceNum,
    initialClosingPriceDen,
    { from: account }
  );
};

// const setAndCheckAuctionStarted = async (ST, BT) => {
//   const { DutchExchange: dx, EtherToken: eth, TokenGNO: gno } = await getContracts();
//   ST = ST || eth;
//   BT = BT || gno;
//   const latestBlock = await web3.eth.getBlock('latest');

//   const startingTimeOfAuction = (await dx.getAuctionStart.call(ST.address, BT.address)).toString();
//   assert.equal(startingTimeOfAuction > 1, true, 'Auction hasn`t started yet');

//   // wait for the right time to send buyOrder
//   // implements isAtLeastZero (aka will not go BACK in time)
//   await wait(startingTimeOfAuction - latestBlock.timestamp);

//   log(`
//   time now ----------> ${new Date(timestamp() * 1000)}
//   auction starts ----> ${new Date(startingTimeOfAuction * 1000)}
//   `);

//   assert.equal(timestamp() >= startingTimeOfAuction, true);
// };
