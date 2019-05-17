import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import {
  AuctionCleared,
  AuctionStartScheduled,
  DutchExchange
} from './types/DutchExchange/DutchExchange';
import { auctionId } from './utils';
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

export function handleAuctionCleared(event: AuctionCleared): void {
  // // for ease of use
  // let params = event.params;
  // // get the final price of the tokens (sell / buy) and the clearing time
  // let dutchExchange = DutchExchange.bind(event.address);
  // let price = dutchExchange.getPriceInPastAuction(
  //   params.sellToken,
  //   params.buyToken,
  //   params.auctionIndex
  // );
  // let clearingTime = dutchExchange.getClearingTime(
  //   params.sellToken,
  //   params.buyToken,
  //   params.auctionIndex
  // );
  // // auction should already exist, but if not, create a new one
  // let auctionId = auctionId(params.sellToken, params.buyToken, params.auctionIndex);
  // let auction = Auction.load(auctionId);
  // if (auction == null) {
  //   auction = new Auction(auctionId);
  //   auction.sellToken = params.sellToken;
  //   auction.buyToken = params.buyToken;
  //   auction.auctionIndex = params.auctionIndex;
  //   auction.startTime = 0;
  // }
  // // assign new values to the entity
  // auction.sellVolume = params.sellVolume;
  // auction.buyVolume = params.buyVolume;
  // auction.priceNum = price.value0;
  // auction.priceDen = price.value1;
  // auction.cleared = true;
  // auction.clearingTime = clearingTime;
  // auction.save();
}
