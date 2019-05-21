import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import {
  auctionId,
  add256,
  zeroAsBigInt,
  tokenPairId,
  oneAsBigInt,
  orderId,
  checkIfValueExistsInArray,
  tokenAuctionBalanceId
} from './utils';
import { NewSellerFundsClaim } from './types/DutchExchange/DutchExchange';
import {
  Auction,
  TokenPair,
  Trader,
  SellOrder,
  BuyOrder,
  Token,
  TokenAuctionBalance
} from './types/schema';

export function handleNewSellerFundsClaim(event: NewSellerFundsClaim): void {
  let params = event.params;
  let from = event.transaction.from;
  let trader = Trader.load(from.toHex());
  trader.totalFrts = trader.totalFrts.plus(params.frtsIssued);
  trader.save();

  // Set AuctionTokenBalance.sellTokenBalance to 0
  let auctionBalanceId = tokenAuctionBalanceId(
    from,
    auctionId(params.sellToken, params.buyToken, params.auctionIndex)
  );
  let tokenAuctionBalance = TokenAuctionBalance.load(auctionBalanceId);
  if (tokenAuctionBalance == null) {
    tokenAuctionBalance = new TokenAuctionBalance(auctionBalanceId);
  }
  tokenAuctionBalance.sellTokenBalance = zeroAsBigInt;
  tokenAuctionBalance.save();
}
