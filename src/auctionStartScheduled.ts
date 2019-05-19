import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import { auctionId, add256, zeroAsBigInt, tokenPairId } from './utils';
import { AuctionStartScheduled, DutchExchange } from './types/DutchExchange/DutchExchange';
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

export function handleAuctionStartScheduled(event: AuctionStartScheduled): void {
  // Start both auctions
  let params = event.params;

  let sellTokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken));
  if (sellTokenPair == null) {
    sellTokenPair = new TokenPair(tokenPairId(params.sellToken, params.buyToken));
  }
  sellTokenPair.sellToken = params.sellToken;
  sellTokenPair.buyToken = params.buyToken;
  sellTokenPair.totalSellVolume = zeroAsBigInt;
  sellTokenPair.totalBuyVolume = zeroAsBigInt;
  sellTokenPair.listingTime = params.auctionStart;
  sellTokenPair.listingTransactionHash = event.transaction.hash;
  sellTokenPair.latestStartTime = params.auctionStart;
  sellTokenPair.save();

  let buyTokenPair = TokenPair.load(tokenPairId(params.buyToken, params.sellToken));
  if (buyTokenPair == null) {
    buyTokenPair = new TokenPair(tokenPairId(params.buyToken, params.sellToken));
  }
  buyTokenPair.sellToken = params.buyToken;
  buyTokenPair.buyToken = params.sellToken;
  buyTokenPair.totalSellVolume = zeroAsBigInt;
  buyTokenPair.totalBuyVolume = zeroAsBigInt;
  buyTokenPair.listingTime = params.auctionStart;
  buyTokenPair.listingTransactionHash = event.transaction.hash;
  buyTokenPair.latestStartTime = params.auctionStart;
  buyTokenPair.save();

  // Initial funding Trader, will be missing from Auction in this setup
  let sellAuctionId = auctionId(params.sellToken, params.buyToken, params.auctionIndex);
  let sellAuction = Auction.load(sellAuctionId);
  if (sellAuction == null) {
    sellAuction = new Auction(sellAuctionId);
    sellAuction.totalFeesPaid = zeroAsBigInt;
  }
  sellAuction.sellToken = params.sellToken;
  sellAuction.buyToken = params.buyToken;
  sellAuction.auctionIndex = params.auctionIndex;
  sellAuction.sellVolume = zeroAsBigInt;
  sellAuction.buyVolume = zeroAsBigInt;
  sellAuction.priceNum = zeroAsBigInt;
  sellAuction.priceDen = zeroAsBigInt;
  sellAuction.cleared = false;
  sellAuction.startTime = params.auctionStart;
  sellAuction.clearingTime = zeroAsBigInt;
  sellAuction.tokenPair = sellTokenPair.id;
  sellAuction.traders = [];
  sellAuction.save();

  let buyAuctionId = auctionId(params.buyToken, params.sellToken, params.auctionIndex);
  let buyAuction = Auction.load(buyAuctionId);
  if (buyAuction == null) {
    buyAuction = new Auction(buyAuctionId);
    buyAuction.totalFeesPaid = zeroAsBigInt;
  }
  buyAuction.sellToken = params.buyToken;
  buyAuction.buyToken = params.sellToken;
  buyAuction.auctionIndex = params.auctionIndex;
  buyAuction.sellVolume = zeroAsBigInt;
  buyAuction.buyVolume = zeroAsBigInt;
  buyAuction.priceNum = zeroAsBigInt;
  buyAuction.priceDen = zeroAsBigInt;
  buyAuction.cleared = false;
  buyAuction.startTime = params.auctionStart;
  buyAuction.clearingTime = zeroAsBigInt;

  buyAuction.tokenPair = buyTokenPair.id;
  buyAuction.traders = [];
  buyAuction.save();
}
