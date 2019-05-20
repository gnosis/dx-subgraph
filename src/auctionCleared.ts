import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import {
  AuctionCleared,
  AuctionStartScheduled,
  DutchExchange
} from './types/DutchExchange/DutchExchange';
import { auctionId, add256, zeroAsBigInt, tokenPairId, oneAsBigInt } from './utils';
import {
  Auction,
  TokenPair,
  Trader,
  SellOrder,
  BuyOrder,
  Token,
  TokenAuctionBalance
} from './types/schema';

export function handleAuctionCleared(event: AuctionCleared): void {
  let params = event.params;
  let dutchExchange = DutchExchange.bind(event.address);

  let closingPriceOpp = dutchExchange.closingPrices(
    params.buyToken,
    params.sellToken,
    params.auctionIndex
  );

  let clearingTime = dutchExchange.getClearingTime(
    params.sellToken,
    params.buyToken,
    params.auctionIndex
  );

  // auction should already exist, but if not, create a new one
  let sellAuctionId = auctionId(params.sellToken, params.buyToken, params.auctionIndex);
  let sellAuction = Auction.load(sellAuctionId);
  sellAuction.auctionIndex = params.auctionIndex;
  sellAuction.sellVolume = params.sellVolume;
  sellAuction.buyVolume = params.buyVolume;
  sellAuction.cleared = true;
  sellAuction.clearingTime = clearingTime;
  sellAuction.save();

  let buyAuctionId = auctionId(params.buyToken, params.sellToken, params.auctionIndex);
  let buyAuction = Auction.load(buyAuctionId);
  if (buyAuction == null) {
    buyAuction = new Auction(buyAuctionId);
    buyAuction.sellToken = params.buyToken;
    buyAuction.buyToken = params.sellToken;
  }
  buyAuction.auctionIndex = params.auctionIndex;
  buyAuction.sellVolume = closingPriceOpp.value1;
  buyAuction.buyVolume = closingPriceOpp.value0;
  buyAuction.cleared = true;
  buyAuction.clearingTime = clearingTime;
  buyAuction.save();

  // TokenPair SECTION
  let sellTokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken));
  sellTokenPair.totalSellVolume = sellTokenPair.totalSellVolume.plus(params.sellVolume);
  sellTokenPair.totalBuyVolume = sellTokenPair.totalBuyVolume.plus(params.buyVolume);
  sellTokenPair.currentAuctionIndex = params.auctionIndex.plus(oneAsBigInt);
  sellTokenPair.latestClearTime = event.block.timestamp;
  sellTokenPair.save();

  let buyTokenPair = TokenPair.load(tokenPairId(params.buyToken, params.sellToken));
  buyTokenPair.totalSellVolume = buyTokenPair.totalSellVolume.plus(closingPriceOpp.value1);
  buyTokenPair.totalBuyVolume = buyTokenPair.totalBuyVolume.plus(closingPriceOpp.value0);
  buyTokenPair.currentAuctionIndex = params.auctionIndex.plus(oneAsBigInt);
  buyTokenPair.latestClearTime = event.block.timestamp;
  buyTokenPair.save();
}
