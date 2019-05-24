import { auctionId, tokenAuctionBalanceId } from './utils';
import { NewBuyerFundsClaim } from './types/DutchExchange/DutchExchange';
import { Trader, TokenBalance, TokenAuctionBalance } from './types/schema';
import { zeroAsBigInt, tokenBalanceId } from './utils';

export function handleNewBuyerFundsClaim(event: NewBuyerFundsClaim): void {
  let params = event.params;

  // Trader SECTION
  let from = event.transaction.from;
  let trader = Trader.load(from.toHex());
  trader.totalFrts = trader.totalFrts.plus(params.frtsIssued);
  trader.save();

  // TokenBalance SECTION
  let tokenBalance = TokenBalance.load(tokenBalanceId(from, params.sellToken));
  tokenBalance.balance = tokenBalance.balance.plus(params.amount);
  tokenBalance.save();

  // TokenAuctionBalance SECTION
  let auctionBalanceId = tokenAuctionBalanceId(
    from,
    auctionId(params.sellToken, params.buyToken, params.auctionIndex)
  );
  let tokenAuctionBalance = TokenAuctionBalance.load(auctionBalanceId);
  if (tokenAuctionBalance == null) {
    tokenAuctionBalance = new TokenAuctionBalance(auctionBalanceId);
  }
  tokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
  tokenAuctionBalance.save();
}
