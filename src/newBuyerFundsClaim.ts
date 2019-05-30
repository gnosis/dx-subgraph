import { auctionId, tokenAuctionBalanceId } from './utils';
import { NewBuyerFundsClaim } from './types/DutchExchange/DutchExchange';
import { Trader, /*TokenBalance, TokenAuctionBalance,*/ Token } from './types/schema';
import { zeroAsBigInt, tokenBalanceId } from './utils';

export function handleNewBuyerFundsClaim(event: NewBuyerFundsClaim): void {
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
    // trader.tokenAuctionBalances = [];
  }
  trader.totalFrts = trader.totalFrts.plus(params.frtsIssued);
  trader.save();

  // TokenBalance SECTION
  // let tokenBalance = TokenBalance.load(tokenBalanceId(params.user, params.sellToken));
  // if (tokenBalance == null) {
  //   tokenBalance = new TokenBalance(tokenBalanceId(params.user, params.sellToken));
  //   tokenBalance.trader = trader.id;
  //   tokenBalance.token = Token.load(params.sellToken.toHex()).id;
  //   tokenBalance.totalDeposited = zeroAsBigInt;
  //   tokenBalance.totalWithdrawn = zeroAsBigInt;
  //   tokenBalance.balance = zeroAsBigInt;
  // }
  // tokenBalance.balance = tokenBalance.balance.plus(params.amount);
  // tokenBalance.save();

  // TokenAuctionBalance SECTION
  // let auctionBalanceId = tokenAuctionBalanceId(
  //   params.user,
  //   auctionId(params.sellToken, params.buyToken, params.auctionIndex)
  // );
  // let tokenAuctionBalance = TokenAuctionBalance.load(auctionBalanceId);
  // if (tokenAuctionBalance == null) {
  //   tokenAuctionBalance = new TokenAuctionBalance(auctionBalanceId);
  // }
  // tokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
  // tokenAuctionBalance.save();
}
