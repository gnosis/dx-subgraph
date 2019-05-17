import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import { add256, auctionId, tokenPairId, zeroAsBigInt, oneAsBigInt, orderId } from './utils';
import { NewTokenPair, DutchExchange } from './types/DutchExchange/DutchExchange';
import { Token, TokenPair, Auction, TokenAuctionBalance, Trader, SellOrder } from './types/schema';

export function handleNewTokenPair(event: NewTokenPair): void {
  let dx = DutchExchange.bind(event.address);
  let from = event.transaction.from;
  let params = event.params;

  let sellTokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken));
  if (sellTokenPair == null) {
    sellTokenPair = new TokenPair(tokenPairId(params.sellToken, params.buyToken));
  }
  sellTokenPair.save();

  let buyTokenPair = TokenPair.load(tokenPairId(params.buyToken, params.sellToken));
  if (buyTokenPair == null) {
    buyTokenPair = new TokenPair(tokenPairId(params.buyToken, params.sellToken));
  }
  buyTokenPair.save();

  let sellAuction = new Auction(auctionId(params.sellToken, params.buyToken, zeroAsBigInt));
  sellAuction.sellToken = params.sellToken;
  sellAuction.buyToken = params.buyToken;
  sellAuction.cleared = true;
  sellAuction.auctionIndex = zeroAsBigInt;
  sellAuction.tokenPair = sellTokenPair.id;
  sellAuction.save();

  let buyAuction = new Auction(auctionId(params.buyToken, params.sellToken, zeroAsBigInt));
  buyAuction.sellToken = params.buyToken;
  buyAuction.buyToken = params.sellToken;
  buyAuction.cleared = true;
  buyAuction.auctionIndex = zeroAsBigInt;
  buyAuction.tokenPair = buyTokenPair.id;
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

  let sellOrderSellToken = new SellOrder(orderId(event.transaction.hash, params.sellToken));
  sellOrderSellToken.auction = sellAuction.id;
  sellOrderSellToken.tokenPair = sellTokenPair.id;
  sellOrderSellToken.trader = Trader.load(from.toHex()).id;
  sellOrderSellToken.amount = sellerBalanceSellToken;
  sellOrderSellToken.timestamp = event.block.timestamp;
  sellOrderSellToken.transactionHash = event.transaction.hash;
  sellOrderSellToken.save();

  let sellOrderBuyToken = new SellOrder(orderId(event.transaction.hash, params.buyToken));
  sellOrderBuyToken.auction = buyAuction.id;
  sellOrderBuyToken.tokenPair = buyTokenPair.id;
  sellOrderBuyToken.trader = Trader.load(from.toHex()).id;
  sellOrderBuyToken.amount = sellerBalanceBuyToken;
  sellOrderBuyToken.timestamp = event.block.timestamp;
  sellOrderBuyToken.transactionHash = event.transaction.hash;
  sellOrderBuyToken.save();

  let sellTokenAuctionBalanceId: string =
    from.toHex() + auctionId(params.sellToken, params.buyToken, oneAsBigInt);
  let sellTokenAuctionBalance = new TokenAuctionBalance(sellTokenAuctionBalanceId);
  sellTokenAuctionBalance.trader = Trader.load(from.toHex()).id;
  sellTokenAuctionBalance.auction = sellAuction.id;
  sellTokenAuctionBalance.sellTokenBalance = sellerBalanceSellToken;
  sellTokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
  sellTokenAuctionBalance.save();

  let buyTokenAuctionBalanceId: string =
    from.toHex() + auctionId(params.buyToken, params.sellToken, oneAsBigInt);
  let buyTokenAuctionBalance = new TokenAuctionBalance(buyTokenAuctionBalanceId);
  buyTokenAuctionBalance.trader = Trader.load(from.toHex()).id;
  buyTokenAuctionBalance.auction = buyAuction.id;
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
