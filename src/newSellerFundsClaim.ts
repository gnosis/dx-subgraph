import { auctionId, zeroAsBigInt, tokenAuctionBalanceId, tokenBalanceId } from './utils';
import { NewSellerFundsClaim } from './types/DutchExchange/DutchExchange';
import { Trader, TokenBalance, TokenAuctionBalance, Token } from './types/schema';

export function handleNewSellerFundsClaim(event: NewSellerFundsClaim): void {
  let params = event.params;

  // Trader SECTION
  let trader = Trader.load(params.user.toHex());
  if (trader == null) {
    trader = new Trader(params.user.toHex());
    trader.firstParticipation = zeroAsBigInt;
    trader.totalFrts = zeroAsBigInt;
    trader.sellOrders = [];
    trader.buyOrders = [];
    trader.tokenPairsParticipated = [];
    trader.tokensParticipated = [];
    trader.tokenAuctionBalances = [];
  }
  trader.totalFrts = trader.totalFrts.plus(params.frtsIssued);
  trader.save();

  // TokenBalance SECTION
  let tokenBalance = TokenBalance.load(tokenBalanceId(params.user, params.buyToken));
  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(tokenBalanceId(params.user, params.buyToken));
    tokenBalance.trader = trader.id;
    tokenBalance.token = Token.load(params.buyToken.toHex()).id;
    tokenBalance.totalDeposited = zeroAsBigInt;
    tokenBalance.totalWithdrawn = zeroAsBigInt;
    tokenBalance.balance = zeroAsBigInt;
  }
  tokenBalance.balance = tokenBalance.balance.plus(params.amount);
  tokenBalance.save();

  // TokenAuctionBalance SECTION
  let auctionBalanceId = tokenAuctionBalanceId(
    params.user,
    auctionId(params.sellToken, params.buyToken, params.auctionIndex)
  );
  let tokenAuctionBalance = TokenAuctionBalance.load(auctionBalanceId);
  if (tokenAuctionBalance == null) {
    tokenAuctionBalance = new TokenAuctionBalance(auctionBalanceId);
  }
  tokenAuctionBalance.sellTokenBalance = zeroAsBigInt;
  tokenAuctionBalance.save();
}
