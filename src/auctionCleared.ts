import { AuctionCleared, DutchExchange } from './types/DutchExchange/DutchExchange';
import { auctionId, tokenPairId } from './utils';
import { Auction, TokenPair } from './types/schema';

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

  // Auction SECTION
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
  buyAuction.auctionIndex = params.auctionIndex;
  buyAuction.sellVolume = closingPriceOpp.value1;
  buyAuction.buyVolume = closingPriceOpp.value0;
  buyAuction.cleared = true;
  buyAuction.clearingTime = clearingTime;
  buyAuction.save();

  // TokenPair SECTION
  let tokenPair = TokenPair.load(tokenPairId(params.sellToken, params.buyToken));
  tokenPair.currentAuctionIndex += 1;
  tokenPair.latestClearTime = event.block.timestamp;
  tokenPair.save();
}
