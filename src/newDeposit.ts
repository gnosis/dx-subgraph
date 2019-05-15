import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';

import { NewDeposit } from './types/DutchExchange/DutchExchange';
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

export function handleNewDeposit(event: NewDeposit): void {}
