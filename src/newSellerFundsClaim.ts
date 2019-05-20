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
  // Add to the users token balance
  // Subtract from the users AuctionTokenBalance
  // Perhaps add to a users totalFrts
}
