import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';
import {
  NewDeposit,
  NewWithdrawal,
  NewSellOrder,
  NewBuyOrder,
  NewSellerFundsClaim,
  NewBuyerFundsClaim,
  NewTokenPair,
  AuctionCleared,
  AuctionStartScheduled,
  Fee
} from './types/DutchExchange/DutchExchange';
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
