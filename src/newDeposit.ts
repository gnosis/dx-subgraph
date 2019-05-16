import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import { add256, zeroAsBigInt } from './utils';
import { NewDeposit, DutchExchange } from './types/DutchExchange/DutchExchange';
import {
  Auction,
  TokenPair,
  Trader,
  SellOrder,
  BuyOrder,
  Token,
  TokenBalance,
  TokenAuctionBalance
} from './types/schema';

export function handleNewDeposit(event: NewDeposit): void {
  let params = event.params;
  let from = event.transaction.from;
  let dx = DutchExchange.bind(event.address);

  // Token SECTION
  let token = Token.load(params.token.toHex());
  if (token == null) {
    token = new Token(params.token.toHex());
    token.sellOrders = [];
    token.buyOrders = [];
    token.Traders = [];
    token.tokenBalances = [];
    token.tokenPairs = [];
    token.whitelisted = false;
  }

  token.save();

  // Trader SECTION
  // NOTE: still need to include FRTs
  let trader = Trader.load(from.toHex());
  if (trader == null) {
    trader = new Trader(from.toHex());
    trader.firstParticipation = event.block.timestamp;
  }
  trader.lastActive = event.block.timestamp;
  trader.save();

  // TokenBalance SECTION
  let tokenBalance = TokenBalance.load(add256(from, params.token).toHex());
  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(add256(from, params.token).toHex());
    tokenBalance.trader = trader.id;
    tokenBalance.token = token.id;
    tokenBalance.totalDeposited = params.amount;
    tokenBalance.totalWithdrawn = zeroAsBigInt;
  }
  tokenBalance.balance = tokenBalance.balance.plus(params.amount);
  tokenBalance.save();
}
