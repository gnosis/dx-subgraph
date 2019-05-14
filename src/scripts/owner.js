/* global artifacts */
/* eslint no-undef: "error" */

const DutchExchange = artifacts.require('DutchExchange');
// const DutchExchangeProxy = artifacts.require('DutchExchangeProxy');

async function printOwner() {
  // const dxProxy = await DutchExchangeProxy.deployed();
  // const dx = DutchExchange.at(dxProxy.address);
  const dx = await DutchExchange.at('0xaaeb2035ff394fdb2c879190f95e7676f1a9444b');

  const owner = await dx.auctioneer.call();

  console.log(`Auctioneer for DutchX is, ${owner}`);
}

module.exports = done => {
  printOwner()
    .then(done)
    .catch(done);
};
