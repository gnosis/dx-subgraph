import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import {
  auctionId,
  add256,
  zeroAsBigInt,
  tokenPairId,
  oneAsBigInt,
  orderId,
  checkIfValueExistsInArray,
  tokenAuctionBalanceId
} from './utils';
import { NewSellOrder } from './types/DutchExchange/DutchExchange';
import {
  Auction,
  TokenPair,
  Trader,
  SellOrder,
  BuyOrder,
  Token,
  TokenAuctionBalance
} from './types/schema';

export function handleNewSellOrder(event: NewSellOrder): void {
  let params = event.params;
  let from = event.transaction.from;
  let trader = Trader.load(from.toHex());
  trader.lastActive = event.block.timestamp;
  trader.save();
  let auction = Auction.load(auctionId(params.sellToken, params.buyToken, params.auctionIndex));

  // Add the SellOrder
  let sellOrder = new SellOrder(orderId(event.transaction.hash, params.sellToken));
  sellOrder.auction = auction.id;
  sellOrder.tokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken)).id;
  sellOrder.trader = trader.id;
  sellOrder.amount = params.amount;
  sellOrder.timestamp = event.block.timestamp;
  sellOrder.transactionHash = event.transaction.hash;
  sellOrder.save();

  // Add the SellOrder to the Token.SellOrders
  let token = Token.load(params.sellToken.toHex());
  let tokenSellOrders = token.sellOrders;
  tokenSellOrders[tokenSellOrders.length] = sellOrder.id;
  token.sellOrders = tokenSellOrders;
  token.save();

  // Add the trader to the auction
  let auctionTraders = auction.traders;
  if (!checkIfValueExistsInArray(auction.traders as string[], trader.id)) {
    auctionTraders[auctionTraders.length] = trader.id;
    auction.traders = auctionTraders;
    auction.save();
  }

  // Add the TokenAuctionBalance
  let tokenAuctionBalanceId = tokenAuctionBalanceId(
    from,
    auctionId(params.sellToken, params.buyToken, params.auctionIndex)
  );
  let tokenAuctionBalance = TokenAuctionBalance.load(tokenAuctionBalanceId);
  if (tokenAuctionBalance == null) {
    tokenAuctionBalance = new TokenAuctionBalance(tokenAuctionBalanceId);
    tokenAuctionBalance.trader = trader.id;
    tokenAuctionBalance.auction = auction.id;
    tokenAuctionBalance.sellTokenBalance = zeroAsBigInt;
    tokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
    tokenAuctionBalance.totalFeesPaid = zeroAsBigInt;
  }
  tokenAuctionBalance.sellTokenBalance = tokenAuctionBalance.sellTokenBalance.plus(params.amount);
  tokenAuctionBalance.save();
}
