import { ByteArray } from '@graphprotocol/graph-ts';
import {
  auctionId,
  zeroAsBigInt,
  tokenPairId,
  transactionId,
  checkIfValueExistsInArray,
  tokenBalanceId,
  tokenAuctionBalanceId
} from './utils';
import { NewSellOrder, DutchExchange } from './types/DutchExchange/DutchExchange';
import {
  Auction,
  TokenPair,
  Trader,
  SellOrder,
  Token,
  TokenAuctionBalance,
  TokenBalance
} from './types/schema';

export function handleNewSellOrder(event: NewSellOrder): void {
  let params = event.params;
  let dx = DutchExchange.bind(event.address);
  let tokenOrder = dx.getTokenOrder(params.sellToken, params.buyToken);

  // Trader SECTION
  let trader = Trader.load(params.user.toHex());
  if (trader == null) {
    trader = new Trader(params.user.toHex());
    trader.firstParticipation = zeroAsBigInt;
    trader.totalFrts = zeroAsBigInt;
    trader.sellOrders = [];
    trader.buyOrders = [];
    trader.tokenPairsParticipated = [];
    trader.tokensParticipated = [];
    trader.tokenAuctionBalances = [];
  }
  let traderParticipation = trader.firstParticipation;
  if (traderParticipation.equals(zeroAsBigInt)) {
    traderParticipation = event.block.timestamp;
    trader.firstParticipation = traderParticipation;
  }
  trader.lastActive = event.block.timestamp;
  trader.save();

  // Auction SECTION
  let auction = Auction.load(auctionId(params.sellToken, params.buyToken, params.auctionIndex));
  if (auction == null) {
    auction = new Auction(auctionId(params.sellToken, params.buyToken, params.auctionIndex));
    auction.traders = [];
    auction.sellOrders = [];
    auction.buyOrders = [];
  }
  let auctionTraders = auction.traders;
  if (!checkIfValueExistsInArray(auction.traders as string[], trader.id)) {
    auctionTraders[auctionTraders.length] = trader.id;
    auction.traders = auctionTraders;
  }
  auction.save();

  // TokenPair SECTION
  let tokenPair = TokenPair.load(tokenPairId(tokenOrder.value0, tokenOrder.value1));
  let tokenPairTraders = tokenPair.traders;
  if (!checkIfValueExistsInArray(tokenPair.traders as string[], trader.id)) {
    tokenPairTraders[tokenPairTraders.length] = trader.id;
    tokenPair.traders = tokenPairTraders;
    tokenPair.save();
  }

  // SellOrder SECTION
  let sellOrder = new SellOrder(
    transactionId(event.transaction.hash, params.sellToken, params.amount as ByteArray)
  );
  sellOrder.auction = auction.id;
  sellOrder.tokenPair = tokenPair.id;
  sellOrder.trader = trader.id;
  sellOrder.amount = params.amount;
  sellOrder.timestamp = event.block.timestamp;
  sellOrder.transactionHash = event.transaction.hash;
  sellOrder.save();

  // Token SECTION
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

  // TokenBalance Section
  let tokenBalance = TokenBalance.load(tokenBalanceId(params.user, params.sellToken));
  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(tokenBalanceId(params.user, params.sellToken));
    tokenBalance.trader = trader.id;
    tokenBalance.token = token.id;
    tokenBalance.totalDeposited = zeroAsBigInt;
    tokenBalance.totalWithdrawn = zeroAsBigInt;
    tokenBalance.balance = zeroAsBigInt;
  }
  tokenBalance.balance = tokenBalance.balance.minus(params.amount);
  tokenBalance.save();

  // TokenAuctionBalance SECTION
  let tokenAuctionBalance = TokenAuctionBalance.load(
    tokenAuctionBalanceId(
      params.user,
      auctionId(params.sellToken, params.buyToken, params.auctionIndex)
    )
  );
  if (tokenAuctionBalance == null) {
    tokenAuctionBalance = new TokenAuctionBalance(
      tokenAuctionBalanceId(
        params.user,
        auctionId(params.sellToken, params.buyToken, params.auctionIndex)
      )
    );
    tokenAuctionBalance.trader = trader.id;
    tokenAuctionBalance.auction = auction.id;
    tokenAuctionBalance.sellTokenBalance = zeroAsBigInt;
    tokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
    tokenAuctionBalance.totalFeesPaid = zeroAsBigInt;
  }
  tokenAuctionBalance.sellTokenBalance = tokenAuctionBalance.sellTokenBalance.plus(params.amount);
  tokenAuctionBalance.save();
}
