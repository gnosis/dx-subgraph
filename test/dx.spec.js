/* global artifacts, contract, it */
/* eslint no-undef: "error" */

const DutchExchangeProxy = artifacts.require('DutchExchangeProxy');

contract('DutchExchange', () => {
  it('DutchExchange', async () => {
    const dx = await DutchExchangeProxy.deployed();
    console.log('DutchX: ', dx.address);
  });
});
