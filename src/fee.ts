import { auctionId, zeroAsBigInt, tokenBalanceId, tokenAuctionBalanceId } from './utils';
import { Fee } from './types/DutchExchange/DutchExchange';

import { Auction, /*TokenAuctionBalance*/ /*TokenBalance*/ Trader, Token } from './types/schema';

export function handleFee(event: Fee): void {
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
  trader.save();

  // Token SECTION
  let token = Token.load(params.primaryToken.toHex());
  if (token == null) {
    token = new Token(params.primaryToken.toHex());
    token.sellOrders = [];
    token.buyOrders = [];
    token.traders = [];
    token.tokenPairs = [];
    token.whitelisted = false;
  }
  token.save();

  // Auction SECTION
  let auction = Auction.load(
    auctionId(params.primaryToken, params.secondarToken, params.auctionIndex)
  );
  if (auction == null) {
    auction = new Auction(
      auctionId(params.primaryToken, params.secondarToken, params.auctionIndex)
    );
    auction.sellVolume = zeroAsBigInt;
    auction.buyVolume = zeroAsBigInt;
    auction.cleared = false;
    auction.clearingTime = zeroAsBigInt;
    auction.totalFeesPaid = zeroAsBigInt;
    auction.traders = [];
    auction.sellOrders = [];
    auction.buyOrders = [];
  }
  auction.totalFeesPaid = auction.totalFeesPaid.plus(params.fee);
  auction.save();

  // TokenBalance SECTION
    // let tokenBalance = TokenBalance.load(tokenBalanceId(params.user, params.primaryToken));
    // if (tokenBalance == null) {
    //   tokenBalance = new TokenBalance(tokenBalanceId(params.user, params.primaryToken));
    //   tokenBalance.trader = trader.id;
    //   tokenBalance.token = token.id;
    //   tokenBalance.totalDeposited = zeroAsBigInt;
    //   tokenBalance.totalWithdrawn = zeroAsBigInt;
    //   tokenBalance.balance = zeroAsBigInt;
    // }
    // tokenBalance.balance = tokenBalance.balance.minus(params.fee);
    // tokenBalance.save();

  // TokenAuctionBalance SECTION
    // let tokenAuctionBalance = TokenAuctionBalance.load(
    //   tokenAuctionBalanceId(
    //     params.user,
    //     auctionId(params.primaryToken, params.secondarToken, params.auctionIndex)
    //   )
    // );
    // if (tokenAuctionBalance == null) {
    //   tokenAuctionBalance = new TokenAuctionBalance(
    //     tokenAuctionBalanceId(
    //       params.user,
    //       auctionId(params.primaryToken, params.secondarToken, params.auctionIndex)
    //     )
    //   );
    //   tokenAuctionBalance.trader = trader.id;
    //   tokenAuctionBalance.auction = auction.id;
    //   tokenAuctionBalance.sellTokenBalance = zeroAsBigInt;
    //   tokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
    //   tokenAuctionBalance.totalFeesPaid = zeroAsBigInt;
    // }
    // tokenAuctionBalance.totalFeesPaid = tokenAuctionBalance.totalFeesPaid.plus(params.fee);
    // tokenAuctionBalance.save();
}
