# DutchX Subgraph

Subgraph for the DutchX Protocol.

--- 

Due to technical limitations surrounding the DutchX contracts, this version has been adjusted to exclude Deposit, Withdrawal, TokenBalance, and TokenAuctionBalance entities.

It also does not include the initial sell orders from the `addTokenPair( )` function.

These changes are due to there not being a way to get the `msg.sender` variable from input parameters, output parameters, or event logs for these three functions [Deposiit, Withdrawal, and AddTokenPair) 

## Deployment Instructions

Before the subgraph can be deployed to the main graph node, you must create the ABIs, setup the _network_ and _address_ fields in the `subgraph.yaml`, and make sure to create and deploy to the right subgraph name. Below are the steps to do this:

1.  git clone https://github.com/gnosis/hg-subgraph.git && cd hg-subgraph

2.  npm install

3.  npm run refresh-abi

4.  node ops/set-deployment-environment [network][address]

    You can also alternatively set the network and address in a .env file as envrionment variables. 
    [Using the NETWORK and ADDRESS environment variables]

5.  create the subgraph name desired in `package.json` under the `create` and `deploy` scripts.

6.  npm run create

7.  npm run deploy

---
