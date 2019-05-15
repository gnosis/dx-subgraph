import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';

import { AuctionCleared } from './types/DutchExchange/DutchExchange';
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

export function handleAuctionCleared(event: AuctionCleared): void {}
