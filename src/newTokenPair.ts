import {
  auctionId,
  tokenPairId,
  zeroAsBigInt,
  oneAsBigInt,
  transactionId,
  tokenBalanceId,
  tokenAuctionBalanceId,
  checkIfValueExistsInArray
} from './utils';
import { NewTokenPair, DutchExchange } from './types/DutchExchange/DutchExchange';
import {
  TokenPair,
  Auction,
  TokenAuctionBalance,
  Trader,
  SellOrder,
  Token,
  TokenBalance
} from './types/schema';
import { ByteArray } from '@graphprotocol/graph-ts';

export function handleNewTokenPair(event: NewTokenPair): void {
  let dx = DutchExchange.bind(event.address);
  let params = event.params;
  let from = event.transaction.from;

  let sellerBalanceSellToken = dx.sellerBalances(
    params.sellToken,
    params.buyToken,
    oneAsBigInt,
    from
  );
  let sellerBalanceBuyToken = dx.sellerBalances(
    params.buyToken,
    params.sellToken,
    oneAsBigInt,
    from
  );

  // Trader SECTION
  let trader = Trader.load(from.toHex());
  if (trader == null) {
    trader = new Trader(from.toHex());
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
  }
  trader.save();

  // TokenPair SECTION
  let tokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken));
  if (tokenPair == null) {
    tokenPair = new TokenPair(tokenPairId(params.sellToken, params.buyToken));
    tokenPair.token1 = params.sellToken;
    tokenPair.token2 = params.buyToken;
    tokenPair.currentAuctionIndex = 1;
    tokenPair.auctions = [];
    tokenPair.traders = [];
    tokenPair.listingTimestamp = event.block.timestamp;
    tokenPair.listingTransactionHash = event.transaction.hash;
  }
  let tokenPairTraders = tokenPair.traders;
  if (!checkIfValueExistsInArray(tokenPairTraders as string[], trader.id)) {
    tokenPairTraders[tokenPairTraders.length] = trader.id;
    tokenPair.traders = tokenPairTraders;
  }

  tokenPair.save();

  // Auction SECTION
  let sellAuction = Auction.load(auctionId(params.sellToken, params.buyToken, zeroAsBigInt));
  if (sellAuction == null) {
    sellAuction = new Auction(auctionId(params.sellToken, params.buyToken, zeroAsBigInt));
    sellAuction.traders = [];
    sellAuction.sellOrders = [];
    sellAuction.buyOrders = [];
  }
  sellAuction.sellToken = params.sellToken;
  sellAuction.buyToken = params.buyToken;
  sellAuction.cleared = true;
  sellAuction.auctionIndex = zeroAsBigInt;
  sellAuction.tokenPair = tokenPair.id;
  sellAuction.totalFeesPaid = zeroAsBigInt;
  sellAuction.startTime = event.block.timestamp;
  sellAuction.save();

  let buyAuction = Auction.load(auctionId(params.buyToken, params.sellToken, zeroAsBigInt));
  if (buyAuction == null) {
    buyAuction = new Auction(auctionId(params.buyToken, params.sellToken, zeroAsBigInt));
    buyAuction.traders = [];
    buyAuction.sellOrders = [];
    buyAuction.buyOrders = [];
  }
  buyAuction.sellToken = params.buyToken;
  buyAuction.buyToken = params.sellToken;
  buyAuction.cleared = true;
  buyAuction.auctionIndex = zeroAsBigInt;
  buyAuction.tokenPair = tokenPair.id;
  buyAuction.totalFeesPaid = zeroAsBigInt;
  buyAuction.startTime = event.block.timestamp;
  buyAuction.save();

  let sellAuctionOne = Auction.load(auctionId(params.sellToken, params.buyToken, oneAsBigInt));
  if (sellAuctionOne == null) {
    sellAuctionOne = new Auction(auctionId(params.sellToken, params.buyToken, oneAsBigInt));
    sellAuctionOne.traders = [];
    sellAuctionOne.sellOrders = [];
    sellAuctionOne.buyOrders = [];
  }
  let sellAuctionOneTraders = sellAuctionOne.traders;
  sellAuctionOneTraders[sellAuctionOneTraders.length] = Trader.load(from.toHex()).id;
  sellAuctionOne.traders = sellAuctionOneTraders;
  sellAuctionOne.save();
  let buyAuctionOne = Auction.load(auctionId(params.buyToken, params.sellToken, oneAsBigInt));
  if (buyAuctionOne == null) {
    buyAuctionOne = new Auction(auctionId(params.buyToken, params.sellToken, oneAsBigInt));
    buyAuctionOne.traders = [];
    buyAuctionOne.sellOrders = [];
    buyAuctionOne.buyOrders = [];
  }
  let buyAuctionOneTraders = sellAuctionOne.traders;
  buyAuctionOneTraders[buyAuctionOneTraders.length] = Trader.load(from.toHex()).id;
  buyAuctionOne.traders = buyAuctionOneTraders;
  buyAuctionOne.save();

  // SellOrder SECTION
  let sellOrderSellToken = new SellOrder(
    transactionId(event.transaction.hash, params.sellToken, sellerBalanceSellToken as ByteArray)
  );
  sellOrderSellToken.auction = sellAuctionOne.id;
  sellOrderSellToken.tokenPair = tokenPair.id;
  sellOrderSellToken.trader = Trader.load(from.toHex()).id;
  sellOrderSellToken.amount = sellerBalanceSellToken;
  sellOrderSellToken.timestamp = event.block.timestamp;
  sellOrderSellToken.transactionHash = event.transaction.hash;
  sellOrderSellToken.save();

  let sellOrderBuyToken = new SellOrder(
    transactionId(event.transaction.hash, params.buyToken, sellerBalanceBuyToken as ByteArray)
  );
  sellOrderBuyToken.auction = buyAuctionOne.id;
  sellOrderBuyToken.tokenPair = tokenPair.id;
  sellOrderBuyToken.trader = Trader.load(from.toHex()).id;
  sellOrderBuyToken.amount = sellerBalanceBuyToken;
  sellOrderBuyToken.timestamp = event.block.timestamp;
  sellOrderBuyToken.transactionHash = event.transaction.hash;
  sellOrderBuyToken.save();

  // Token SECTION
  let sellToken = Token.load(params.sellToken.toHex());
  if (sellToken == null) {
    sellToken = new Token(params.sellToken.toHex());
    sellToken.sellOrders = [];
    sellToken.buyOrders = [];
    sellToken.traders = [];
    sellToken.tokenPairs = [];
    sellToken.whitelisted = false;
  }
  let sellTokenTokenPairs = sellToken.tokenPairs;
  sellTokenTokenPairs[sellTokenTokenPairs.length] = tokenPair.id;
  sellTokenTokenPairs[sellTokenTokenPairs.length + 1] = tokenPair.id;
  sellToken.tokenPairs = sellTokenTokenPairs;
  let sellTokenTraders = sellToken.traders;
  if (!checkIfValueExistsInArray(sellToken.traders as string[], trader.id)) {
    sellTokenTraders[sellTokenTraders.length] = trader.id;
    sellToken.traders = sellTokenTraders;
  }
  let sellTokenSellOrders = sellToken.sellOrders;
  sellTokenSellOrders[sellTokenSellOrders.length] = sellOrderSellToken.id;
  sellToken.sellOrders = sellTokenSellOrders;
  sellToken.save();

  let buyToken = Token.load(params.buyToken.toHex());
  if (buyToken == null) {
    buyToken = new Token(params.buyToken.toHex());
    buyToken.sellOrders = [];
    buyToken.buyOrders = [];
    buyToken.traders = [];
    buyToken.tokenPairs = [];
    buyToken.whitelisted = false;
  }
  let buyTokenTokenPairs = buyToken.tokenPairs;
  buyTokenTokenPairs[buyTokenTokenPairs.length] = tokenPair.id;
  buyTokenTokenPairs[buyTokenTokenPairs.length + 1] = tokenPair.id;
  buyToken.tokenPairs = buyTokenTokenPairs;
  let buyTokenTraders = buyToken.traders;
  if (!checkIfValueExistsInArray(buyToken.traders as string[], trader.id)) {
    buyTokenTraders[buyTokenTraders.length] = trader.id;
    buyToken.traders = buyTokenTraders;
  }
  let buyTokenBuyOrders = buyToken.sellOrders;
  buyTokenBuyOrders[buyTokenBuyOrders.length] = sellOrderBuyToken.id;
  buyToken.sellOrders = buyTokenBuyOrders;
  buyToken.save();

  // TokenBalance SECTION
  let tokenBalanceSellToken = TokenBalance.load(tokenBalanceId(from, params.sellToken));
  if (tokenBalanceSellToken == null) {
    tokenBalanceSellToken = new TokenBalance(tokenBalanceId(from, params.sellToken));
    tokenBalanceSellToken.trader = trader.id;
    tokenBalanceSellToken.token = sellToken.id;
    tokenBalanceSellToken.totalDeposited = zeroAsBigInt;
    tokenBalanceSellToken.totalWithdrawn = zeroAsBigInt;
    tokenBalanceSellToken.balance = zeroAsBigInt;
  }
  tokenBalanceSellToken.balance = tokenBalanceSellToken.balance.minus(sellerBalanceSellToken);
  tokenBalanceSellToken.save();

  // TokenBalance SECTION
  let tokenBalanceBuyToken = TokenBalance.load(tokenBalanceId(from, params.buyToken));
  if (tokenBalanceBuyToken == null) {
    tokenBalanceBuyToken = new TokenBalance(tokenBalanceId(from, params.buyToken));
    tokenBalanceBuyToken.trader = trader.id;
    tokenBalanceBuyToken.token = buyToken.id;
    tokenBalanceBuyToken.totalDeposited = zeroAsBigInt;
    tokenBalanceBuyToken.totalWithdrawn = zeroAsBigInt;
    tokenBalanceBuyToken.balance = zeroAsBigInt;
  }
  tokenBalanceBuyToken.balance = tokenBalanceBuyToken.balance.minus(sellerBalanceBuyToken);
  tokenBalanceBuyToken.save();

  // TokenAuctionBalance SECTION
  let sellTokenAuctionBalanceId: string = tokenAuctionBalanceId(
    from,
    auctionId(params.sellToken, params.buyToken, oneAsBigInt)
  );
  let sellTokenAuctionBalance = TokenAuctionBalance.load(sellTokenAuctionBalanceId);
  if (sellTokenAuctionBalance == null) {
    sellTokenAuctionBalance = new TokenAuctionBalance(sellTokenAuctionBalanceId);
  }
  sellTokenAuctionBalance.trader = Trader.load(from.toHex()).id;
  sellTokenAuctionBalance.auction = sellAuctionOne.id;
  sellTokenAuctionBalance.sellTokenBalance = sellerBalanceSellToken;
  sellTokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
  sellTokenAuctionBalance.save();

  let buyTokenAuctionBalanceId: string = tokenAuctionBalanceId(
    from,
    auctionId(params.buyToken, params.sellToken, oneAsBigInt)
  );
  let buyTokenAuctionBalance = TokenAuctionBalance.load(buyTokenAuctionBalanceId);
  if (buyTokenAuctionBalance == null) {
    buyTokenAuctionBalance = new TokenAuctionBalance(buyTokenAuctionBalanceId);
  }
  buyTokenAuctionBalance.trader = Trader.load(from.toHex()).id;
  buyTokenAuctionBalance.auction = buyAuctionOne.id;
  buyTokenAuctionBalance.sellTokenBalance = sellerBalanceBuyToken;
  buyTokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
  buyTokenAuctionBalance.save();
}
