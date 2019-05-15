import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';

import { NewTokenPair } from './types/DutchExchange/DutchExchange';
import { Token, TokenPair } from './types/schema';
import { add256 } from './utils';

export function handleNewTokenPair(event: NewTokenPair): void {
  let params = event.params;

  let sellToken = Token.load(params.sellToken.toHex());
  if (sellToken == null) {
    sellToken = new Token(params.sellToken.toHex());
  }
  sellToken.save();

  let buyToken = Token.load(params.buyToken.toHex());
  if (buyToken == null) {
    buyToken = new Token(params.buyToken.toHex());
  }
  buyToken.save();

  let combinedAddress = add256(params.sellToken, params.buyToken);
  let tokenPair = TokenPair.load(combinedAddress.toHex());
  if (tokenPair == null) {
    tokenPair = new TokenPair(combinedAddress.toHex());
  }
  tokenPair.save();
}
