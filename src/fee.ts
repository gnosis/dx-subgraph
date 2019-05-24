import { auctionId, zeroAsBigInt, tokenAuctionBalanceId } from './utils';
import { Fee } from './types/DutchExchange/DutchExchange';

import { Auction, TokenAuctionBalance } from './types/schema';

export function handleFee(event: Fee): void {
  let params = event.params;

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
    tokenAuctionBalance.totalFeesPaid = zeroAsBigInt;
  }
  tokenAuctionBalance.totalFeesPaid = tokenAuctionBalance.totalFeesPaid.plus(params.fee);
  tokenAuctionBalance.save();


}
