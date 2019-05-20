import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';

import { NewWithdrawal } from './types/DutchExchange/DutchExchange';
import {
  Auction,
  TokenPair,
  Trader,
  SellOrder,
  BuyOrder,
  Token,
  TokenAuctionBalance
} from './types/schema';

export function handleNewWithdrawal(event: NewWithdrawal): void {}
