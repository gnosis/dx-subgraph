import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import { auctionId, add256 } from './utils';
import { AuctionStartScheduled } from './types/DutchExchange/DutchExchange';
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
  let params = event.params;

  let auctionId = auctionId(params.sellToken, params.buyToken, params.auctionIndex);
  let auction = new Auction(auctionId);
  auction.sellToken = params.sellToken;
  auction.buyToken = params.buyToken;
  auction.auctionIndex = params.auctionIndex;
  auction.sellVolume = 0;
  auction.buyVolume = 0;
  auction.priceNum = 0;
  auction.priceDen = 0;
  auction.cleared = false;
  auction.startTime = params.auctionStart;
  auction.clearingTime = 0;
  auction.save();

  let tokenPair = TokenPair.load(add256(params.sellToken, params.buyToken).toHex());
  if (tokenPair == null) {
    tokenPair = new TokenPair(add256(params.sellToken, params.buyToken).toHex());
    tokenPair.sellToken = params.sellToken;
    tokenPair.buyToken = params.buyToken;
    tokenPair.totalSellVolume = 0;
    tokenPair.totalBuyVolume = 0;
  }
  tokenPair.save();
}
