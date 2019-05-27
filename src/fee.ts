import { auctionId, zeroAsBigInt, tokenBalanceId, tokenAuctionBalanceId } from './utils';
import { Fee } from './types/DutchExchange/DutchExchange';

import { Auction, TokenAuctionBalance, TokenBalance, Trader, Token } from './types/schema';

export function handleFee(event: Fee): void {
  let params = event.params;
  let from = event.transaction.from;

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
  let tokenBalance = TokenBalance.load(tokenBalanceId(from, params.primaryToken));
  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(tokenBalanceId(from, params.primaryToken));
    tokenBalance.trader = Trader.load(from.toHex()).id;
    tokenBalance.token = Token.load(params.primaryToken.toHex()).id;
    tokenBalance.totalDeposited = zeroAsBigInt;
    tokenBalance.totalWithdrawn = zeroAsBigInt;
    tokenBalance.balance = zeroAsBigInt;
  }
  tokenBalance.balance = tokenBalance.balance.minus(params.fee);
  tokenBalance.save();

  // TokenAuctionBalance SECTION
  let tokenAuctionBalance = TokenAuctionBalance.load(
    tokenAuctionBalanceId(
      params.user,
      auctionId(params.primaryToken, params.secondarToken, params.auctionIndex)
    )
  );
  if (tokenAuctionBalance == null) {
    tokenAuctionBalance = new TokenAuctionBalance(
      tokenAuctionBalanceId(
        params.user,
        auctionId(params.primaryToken, params.secondarToken, params.auctionIndex)
      )
    );
    tokenAuctionBalance.trader = Trader.load(from.toHex()).id;
    tokenAuctionBalance.auction = auction.id;
    tokenAuctionBalance.sellTokenBalance = zeroAsBigInt;
    tokenAuctionBalance.buyTokenBalance = zeroAsBigInt;
    tokenAuctionBalance.totalFeesPaid = zeroAsBigInt;
  }
  tokenAuctionBalance.totalFeesPaid = tokenAuctionBalance.totalFeesPaid.plus(params.fee);
  tokenAuctionBalance.save();
}
