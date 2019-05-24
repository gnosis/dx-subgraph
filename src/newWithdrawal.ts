import { zeroAsBigInt, checkIfValueExistsInArray, transactionId } from './utils';
import { NewWithdrawal } from './types/DutchExchange/DutchExchange';
import { Trader, Token, Withdrawal } from './types/schema';
import { ByteArray } from '@graphprotocol/graph-ts';

export function handleNewWithdrawal(event: NewWithdrawal): void {
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

  // Withdrawal SECTION
  let withdrawal = new Withdrawal(
    transactionId(event.transaction.hash, params.token, params.amount as ByteArray)
  );
  withdrawal.trader = trader.id;
  withdrawal.token = token.id;
  withdrawal.amount = params.amount;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.transactionHash = event.transaction.hash;
  withdrawal.save();
}
