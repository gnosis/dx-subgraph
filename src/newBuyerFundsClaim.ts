import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import { auctionId, tokenAuctionBalanceId } from './utils';
import { NewBuyerFundsClaim } from './types/DutchExchange/DutchExchange';
import {
  Auction,
  TokenPair,
  Trader,
  SellOrder,
  BuyOrder,
  Token,
  TokenAuctionBalance
} from './types/schema';
import { zeroAsBigInt } from './utils';

export function handleNewBuyerFundsClaim(event: NewBuyerFundsClaim): void {
  let params = event.params;
  let from = event.transaction.from;
  let trader = Trader.load(from.toHex());
  trader.totalFrts = trader.totalFrts.plus(params.frtsIssued);
  trader.save();

  // Set TokenAuctionBalance.buyTokenBalance to 0
  let tokenAuctionBalanceId = tokenAuctionBalanceId(
    from,
    auctionId(params.sellToken, params.buyToken, params.auctionIndex)
  );
  let tokenAuctionBalance = TokenAuctionBalance.load(tokenAuctionBalanceId);
  tokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
  tokenAuctionBalance.save();
}
