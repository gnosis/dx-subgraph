import { ByteArray } from '@graphprotocol/graph-ts';
import { zeroAsBigInt, checkIfValueExistsInArray, transactionId } from './utils';
import { NewDeposit } from './types/DutchExchange/DutchExchange';
import { Trader, Token, Deposit } from './types/schema';

export function handleNewDeposit(event: NewDeposit): void {
  let params = event.params;
  let from = event.transaction.from;

  // Trader SECTION
  let trader = Trader.load(from.toHex());
  if (trader == null) {
    trader = new Trader(from.toHex());
    trader.firstParticipation = event.block.timestamp;
    trader.totalFrts = zeroAsBigInt;
    trader.sellOrders = [];
    trader.buyOrders = [];
    trader.tokenPairsParticipated = [];
    trader.tokensParticipated = [];
    trader.tokenAuctionBalances = [];
    trader.firstParticipation = zeroAsBigInt;
  }
  trader.lastActive = event.block.timestamp;
  trader.save();

  // Token SECTION
  let token = Token.load(params.token.toHex());
  if (token == null) {
    token = new Token(params.token.toHex());
    token.sellOrders = [];
    token.buyOrders = [];
    token.traders = [];
    token.tokenPairs = [];
    token.whitelisted = false;
  }
  let tokenTradersMemory = token.traders;
  if (!checkIfValueExistsInArray(tokenTradersMemory, trader.id)) {
    tokenTradersMemory[tokenTradersMemory.length] = trader.id;
    token.traders = tokenTradersMemory;
  }
  token.save();

  // Deposit SECTION
  let deposit = new Deposit(
    transactionId(event.transaction.hash, params.token, params.amount as ByteArray)
  );
  deposit.trader = trader.id;
  deposit.token = token.id;
  deposit.amount = params.amount;
  deposit.timestamp = event.block.timestamp;
  deposit.transactionHash = event.transaction.hash;
  deposit.save();
}
