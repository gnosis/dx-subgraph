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

  let tokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken));
  let tokenPairTraders = tokenPair.traders;
  if (!checkIfValueExistsInArray(tokenPair.traders as string[], trader.id)) {
    tokenPairTraders[tokenPairTraders.length] = trader.id;
    tokenPair.traders = tokenPairTraders;
    tokenPair.save();
  }
  // Add the SellOrder
  let sellOrder = new SellOrder(orderId(event.transaction.hash, params.sellToken));
  sellOrder.auction = auction.id;
  sellOrder.tokenPair = tokenPair.id;
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
  let tokenTraders = token.traders;
  if (!checkIfValueExistsInArray(token.traders as string[], trader.id)) {
    tokenTraders[tokenTraders.length] = trader.id;
    token.traders = tokenTraders;
  }
  token.save();

  let buyToken = Token.load(params.buyToken.toHex());
  let buyTokenTraders = buyToken.traders;
  if (!checkIfValueExistsInArray(buyToken.traders as string[], trader.id)) {
    buyTokenTraders[buyTokenTraders.length] = trader.id;
    buyToken.traders = buyTokenTraders;
  }
  buyToken.save();

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
