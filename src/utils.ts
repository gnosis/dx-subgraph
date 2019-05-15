import { crypto, Address, BigInt, Bytes, TypedMap, ByteArray } from '@graphprotocol/graph-ts';

export function add256(a: Bytes, b: Bytes): Bytes {
  let aBigInt = new Uint8Array(32) as BigInt;
  let bBigInt = new Uint8Array(32) as BigInt;

  aBigInt.fill(0);
  for (let i = 0; i < a.length && i < 32; i++) {
    aBigInt[i] = a[a.length - 1 - i];
  }

  bBigInt.fill(0);
  for (let i = 0; i < b.length && i < 32; i++) {
    bBigInt[i] = b[b.length - 1 - i];
  }

  let sumBigInt = aBigInt.plus(bBigInt);
  return bigIntToBytes32(sumBigInt);
}

export function bigIntToBytes32(bigInt: BigInt): Bytes {
  let sum = new Uint8Array(32) as Bytes;
  sum.fill(0);
  for (let i = 0; i < bigInt.length && i < 32; i++) {
    sum[31 - i] = bigInt[i];
  }
  return sum;
}
