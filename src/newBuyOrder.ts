import { ByteArray } from '@graphprotocol/graph-ts';
import {
  auctionId,
  zeroAsBigInt,
  tokenPairId,
  transactionId,
  checkIfValueExistsInArray,
  tokenAuctionBalanceId,
  tokenBalanceId
} from './utils';
import { NewBuyOrder, DutchExchange } from './types/DutchExchange/DutchExchange';
import {
  Auction,
  TokenPair,
  Trader,
  BuyOrder,
  Token,
  TokenAuctionBalance,
  TokenBalance
} from './types/schema';

export function handleNewBuyOrder(event: NewBuyOrder): void {
  let params = event.params;
  let dx = DutchExchange.bind(event.address);
  let tokenOrder = dx.getTokenOrder(params.sellToken, params.buyToken);
  let from = event.transaction.from;

  // Trader SECTION
  let trader = Trader.load(from.toHex());
  let traderParticipation = trader.firstParticipation;
  if (traderParticipation.equals(zeroAsBigInt)) {
    traderParticipation = event.block.timestamp;
  }
  trader.firstParticipation = traderParticipation;
  trader.lastActive = event.block.timestamp;
  trader.save();

  // TokenPair SECTION
  let tokenPair = TokenPair.load(tokenPairId(tokenOrder.value0, tokenOrder.value1));
  let tokenPairTraders = tokenPair.traders;
  if (!checkIfValueExistsInArray(tokenPair.traders as string[], trader.id)) {
    tokenPairTraders[tokenPairTraders.length] = trader.id;
    tokenPair.traders = tokenPairTraders;
    tokenPair.save();
  }

  // BuyOrder SECTION
  let buyOrder = new BuyOrder(
    transactionId(event.transaction.hash, params.buyToken, params.amount as ByteArray)
  );
  buyOrder.auction = Auction.load(
    auctionId(params.sellToken, params.buyToken, params.auctionIndex)
  ).id;
  buyOrder.tokenPair = tokenPair.id;
  buyOrder.trader = Trader.load(from.toHex()).id;
  buyOrder.amount = params.amount;
  buyOrder.timestamp = event.block.timestamp;
  buyOrder.transactionHash = event.transaction.hash;
  buyOrder.save();

  // Token SECTION
  let token = Token.load(params.buyToken.toHex());
  let tokenBuyOrders = token.buyOrders;
  tokenBuyOrders[tokenBuyOrders.length] = buyOrder.id;
  token.buyOrders = tokenBuyOrders;
  let tokenTraders = token.traders;
  if (!checkIfValueExistsInArray(token.traders as string[], trader.id)) {
    tokenTraders[tokenTraders.length] = trader.id;
    token.traders = tokenTraders;
  }
  token.save();

  let sellToken = Token.load(params.sellToken.toHex());
  let sellTokenTraders = sellToken.traders;
  if (!checkIfValueExistsInArray(sellToken.traders as string[], trader.id)) {
    sellTokenTraders[sellTokenTraders.length] = trader.id;
    sellToken.traders = sellTokenTraders;
  }
  sellToken.save();

  // Auction SECTION
  let auction = Auction.load(auctionId(params.sellToken, params.buyToken, params.auctionIndex));
  let auctionTraders = auction.traders;
  if (!checkIfValueExistsInArray(auction.traders as string[], trader.id)) {
    auctionTraders[auctionTraders.length] = trader.id;
    auction.traders = auctionTraders;
    auction.save();
  }

  // TokenBalance SECTION
  let tokenBalance = TokenBalance.load(tokenBalanceId(from, params.buyToken));
  tokenBalance.balance = tokenBalance.balance.minus(params.amount);
  tokenBalance.save();

  // TokenAuctionBalance SECTION
  let tokenAuctionBalance = TokenAuctionBalance.load(
    tokenAuctionBalanceId(from, auctionId(params.sellToken, params.buyToken, params.auctionIndex))
  );
  if (tokenAuctionBalance == null) {
    tokenAuctionBalance = new TokenAuctionBalance(
      tokenAuctionBalanceId(from, auctionId(params.sellToken, params.buyToken, params.auctionIndex))
    );
    tokenAuctionBalance.trader = trader.id;
    tokenAuctionBalance.auction = auction.id;
    tokenAuctionBalance.sellTokenBalance = zeroAsBigInt;
    tokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
    tokenAuctionBalance.totalFeesPaid = zeroAsBigInt;
  }
  tokenAuctionBalance.buyTokenBalance = tokenAuctionBalance.buyTokenBalance.plus(params.amount);
  tokenAuctionBalance.save();
}
