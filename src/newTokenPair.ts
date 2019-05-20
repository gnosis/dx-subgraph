import {
  auctionId,
  tokenPairId,
  zeroAsBigInt,
  oneAsBigInt,
  orderId,
  tokenAuctionBalanceId,
  checkIfValueExistsInArray
} from './utils';
import { NewTokenPair, DutchExchange } from './types/DutchExchange/DutchExchange';
import { TokenPair, Auction, TokenAuctionBalance, Trader, SellOrder, Token } from './types/schema';

export function handleNewTokenPair(event: NewTokenPair): void {
  let dx = DutchExchange.bind(event.address);
  let from = event.transaction.from;
  let trader = Trader.load(from.toHex());
  let params = event.params;

  let sellTokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken));
  if (sellTokenPair == null) {
    sellTokenPair = new TokenPair(tokenPairId(params.sellToken, params.buyToken));
    sellTokenPair.currentAuctionIndex = oneAsBigInt;
    sellTokenPair.traders = [];
  }
  sellTokenPair.traders = [Trader.load(from.toHex()).id];
  sellTokenPair.save();

  let buyTokenPair = TokenPair.load(tokenPairId(params.buyToken, params.sellToken));
  if (buyTokenPair == null) {
    buyTokenPair = new TokenPair(tokenPairId(params.buyToken, params.sellToken));
    buyTokenPair.currentAuctionIndex = oneAsBigInt;
    buyTokenPair.traders = [];
  }
  buyTokenPair.traders = [Trader.load(from.toHex()).id];
  buyTokenPair.save();

  let sellAuction = Auction.load(auctionId(params.sellToken, params.buyToken, zeroAsBigInt));
  if (sellAuction == null) {
    sellAuction = new Auction(auctionId(params.sellToken, params.buyToken, zeroAsBigInt));
  }
  sellAuction.sellToken = params.sellToken;
  sellAuction.buyToken = params.buyToken;
  sellAuction.cleared = true;
  sellAuction.auctionIndex = zeroAsBigInt;
  sellAuction.tokenPair = sellTokenPair.id;
  sellAuction.totalFeesPaid = zeroAsBigInt;
  sellAuction.startTime = event.block.timestamp;
  sellAuction.save();

  let buyAuction = Auction.load(auctionId(params.buyToken, params.sellToken, zeroAsBigInt));
  if (buyAuction == null) {
    buyAuction = new Auction(auctionId(params.buyToken, params.sellToken, zeroAsBigInt));
  }
  buyAuction.sellToken = params.buyToken;
  buyAuction.buyToken = params.sellToken;
  buyAuction.cleared = true;
  buyAuction.auctionIndex = zeroAsBigInt;
  buyAuction.tokenPair = buyTokenPair.id;
  buyAuction.totalFeesPaid = zeroAsBigInt;
  buyAuction.startTime = event.block.timestamp;
  buyAuction.save();

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

  // Add initial Sell tokens that aren't accounted for in other events to the mappings
  let sellAuctionOne = Auction.load(auctionId(params.sellToken, params.buyToken, oneAsBigInt));
  let sellAuctionOneTraders = sellAuctionOne.traders;
  sellAuctionOneTraders[sellAuctionOneTraders.length] = Trader.load(from.toHex()).id;
  sellAuctionOne.traders = sellAuctionOneTraders;
  sellAuctionOne.save();
  let buyAuctionOne = Auction.load(auctionId(params.buyToken, params.sellToken, oneAsBigInt));
  let buyAuctionOneTraders = sellAuctionOne.traders;
  buyAuctionOneTraders[buyAuctionOneTraders.length] = Trader.load(from.toHex()).id;
  buyAuctionOne.traders = buyAuctionOneTraders;
  buyAuctionOne.save();

  let sellOrderSellToken = new SellOrder(orderId(event.transaction.hash, params.sellToken));
  sellOrderSellToken.auction = sellAuctionOne.id;
  sellOrderSellToken.tokenPair = sellTokenPair.id;
  sellOrderSellToken.trader = Trader.load(from.toHex()).id;
  sellOrderSellToken.amount = sellerBalanceSellToken;
  sellOrderSellToken.timestamp = event.block.timestamp;
  sellOrderSellToken.transactionHash = event.transaction.hash;
  sellOrderSellToken.save();

  let sellOrderBuyToken = new SellOrder(orderId(event.transaction.hash, params.buyToken));
  sellOrderBuyToken.auction = buyAuctionOne.id;
  sellOrderBuyToken.tokenPair = buyTokenPair.id;
  sellOrderBuyToken.trader = Trader.load(from.toHex()).id;
  sellOrderBuyToken.amount = sellerBalanceBuyToken;
  sellOrderBuyToken.timestamp = event.block.timestamp;
  sellOrderBuyToken.transactionHash = event.transaction.hash;
  sellOrderBuyToken.save();

  let sellToken = Token.load(params.sellToken.toHex());
  let sellTokenTokenPairs = sellToken.tokenPairs;
  sellTokenTokenPairs[sellTokenTokenPairs.length] = sellTokenPair.id;
  sellTokenTokenPairs[sellTokenTokenPairs.length + 1] = buyTokenPair.id;
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
  let buyTokenTokenPairs = buyToken.tokenPairs;
  buyTokenTokenPairs[buyTokenTokenPairs.length] = sellTokenPair.id;
  buyTokenTokenPairs[buyTokenTokenPairs.length + 1] = buyTokenPair.id;
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

// Create an auctions

// The tokens should be in the system already from deposit

// Add the TokenPairs

// add a sell order for the user that's worth sellerBalances[token1][token2][msg.sender]
// add a sell order for the user that's worth sellerBalances[token2][token1][msg.sender]

// sellVolume for Auction can be done continuously or upon clear

// Add new TokenAuctionBalance
