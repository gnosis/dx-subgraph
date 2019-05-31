import { auctionId, zeroAsBigInt, tokenPairId, checkIfValueExistsInArray, oneAsBigInt } from './utils';
import { AuctionStartScheduled, DutchExchange } from './types/DutchExchange/DutchExchange';
import { Auction, TokenPair, Trader } from './types/schema';
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export function handleAuctionStartScheduled(event: AuctionStartScheduled): void {
  let params = event.params;
  let dx = DutchExchange.bind(event.address);
  let tokenOrder = dx.getTokenOrder(params.sellToken, params.buyToken);

  // TokenPair SECTION
  let tokenPair = TokenPair.load(tokenPairId(tokenOrder.value0, tokenOrder.value1));
  if (tokenPair == null) {
    tokenPair = new TokenPair(tokenPairId(tokenOrder.value0, tokenOrder.value1));
    tokenPair.token1 = params.sellToken;
    tokenPair.token2 = params.buyToken;
    tokenPair.currentAuctionIndex = oneAsBigInt
    tokenPair.auctions = [];
    tokenPair.traders = [];
    tokenPair.listingTimestamp = event.block.timestamp;
    tokenPair.listingTransactionHash = event.transaction.hash;
  }
  tokenPair.currentAuctionIndex = params.auctionIndex;
  tokenPair.latestStartTime = params.auctionStart;
  tokenPair.save();

  // Auction SECTION
  let sellAuctionId = auctionId(params.sellToken, params.buyToken, params.auctionIndex);
  let sellAuction = Auction.load(sellAuctionId);
  if (sellAuction == null) {
    sellAuction = new Auction(sellAuctionId);
    sellAuction.totalFeesPaid = zeroAsBigInt;
    sellAuction.traders = [];
    sellAuction.sellOrders = [];
    sellAuction.buyOrders = [];
    sellAuction.buyVolume = zeroAsBigInt;
    sellAuction.sellVolume = zeroAsBigInt;
  }
  sellAuction.sellToken = params.sellToken;
  sellAuction.buyToken = params.buyToken;
  sellAuction.auctionIndex = params.auctionIndex;
  sellAuction.sellVolume = zeroAsBigInt;
  sellAuction.buyVolume = zeroAsBigInt;
  sellAuction.cleared = false;
  sellAuction.startTime = params.auctionStart;
  sellAuction.clearingTime = zeroAsBigInt;
  sellAuction.tokenPair = tokenPair.id;
  sellAuction.traders = [];
  sellAuction.save();

  let buyAuctionId = auctionId(params.buyToken, params.sellToken, params.auctionIndex);
  let buyAuction = Auction.load(buyAuctionId);
  if (buyAuction == null) {
    buyAuction = new Auction(buyAuctionId);
    buyAuction.totalFeesPaid = zeroAsBigInt;
    buyAuction.traders = [];
    buyAuction.sellOrders = [];
    buyAuction.buyOrders = [];
    sellAuction.buyVolume = zeroAsBigInt;
    sellAuction.sellVolume = zeroAsBigInt;
  }
  buyAuction.sellToken = params.buyToken;
  buyAuction.buyToken = params.sellToken;
  buyAuction.auctionIndex = params.auctionIndex;
  buyAuction.sellVolume = zeroAsBigInt;
  buyAuction.buyVolume = zeroAsBigInt;
  buyAuction.cleared = false;
  buyAuction.startTime = params.auctionStart;
  buyAuction.clearingTime = zeroAsBigInt;

  buyAuction.tokenPair = tokenPair.id;
  buyAuction.traders = [];
  buyAuction.save();
}
