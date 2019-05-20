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
import { NewBuyOrder } from './types/DutchExchange/DutchExchange';
import {
  Auction,
  TokenPair,
  Trader,
  SellOrder,
  BuyOrder,
  Token,
  TokenAuctionBalance
} from './types/schema';

export function handleNewBuyOrder(event: NewBuyOrder): void {
  let params = event.params;
  let from = event.transaction.from;
  let trader = Trader.load(from.toHex());
  trader.lastActive = event.block.timestamp;
  trader.save();

  let tokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken));
  let tokenPairTraders = tokenPair.traders;
  if (!checkIfValueExistsInArray(tokenPair.traders as string[], trader.id)) {
    tokenPairTraders[tokenPairTraders.length] = trader.id;
    tokenPair.traders = tokenPairTraders;
    tokenPair.save();
  }
  // Add the buy order
  let buyOrder = new BuyOrder(orderId(event.transaction.hash, params.buyToken));
  buyOrder.auction = Auction.load(
    auctionId(params.sellToken, params.buyToken, params.auctionIndex)
  ).id;
  buyOrder.tokenPair = tokenPair.id;
  buyOrder.trader = Trader.load(from.toHex()).id;
  buyOrder.amount = params.amount;
  buyOrder.timestamp = event.block.timestamp;
  buyOrder.transactionHash = event.transaction.hash;
  buyOrder.save();

  // Add the buy order to Token.buyOrders
  let token = Token.load(params.buyToken.toHex());
  let tokenBuyOrders = token.buyOrders;
  tokenBuyOrders[tokenBuyOrders.length] = buyOrder.id;
  token.buyOrders = tokenBuyOrders;
  token.save();

  // Add the trader to the auction
  let auction = Auction.load(auctionId(params.sellToken, params.buyToken, params.auctionIndex));
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
  tokenAuctionBalance.buyTokenBalance = tokenAuctionBalance.buyTokenBalance.plus(params.amount);
  tokenAuctionBalance.save();
}
