import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';

import { Approval } from './types/DutchExchange/DutchExchange';
import { Token } from './types/schema';

export function handleApproval(event: Approval): void {
  let params = event.params;

  // Token SECTION
  let token = Token.load(params.token.toHex());
  if (token == null) {
    token = new Token(params.token.toHex());
    token.sellOrders = [];
    token.buyOrders = [];
    token.Traders = [];
    token.tokenBalances = [];
    token.tokenPairs = [];
    token.whitelisted = false;
  }
  token.whitelisted = params.approved;
  token.save();
}
