import { add256, zeroAsBigInt, checkIfValueExistsInArray, depositId } from './utils';
import { NewDeposit } from './types/DutchExchange/DutchExchange';
import { Trader, Token } from './types/schema';

export function handleNewDeposit(event: NewDeposit): void {
  let params = event.params;
  let from = event.transaction.from;

  // Trader SECTION
  let trader = Trader.load(from.toHex());
  if (trader == null) {
    trader = new Trader(from.toHex());
    trader.firstParticipation = event.block.timestamp;
    trader.totalFrts = zeroAsBigInt;
    trader.sellOrders = [];
    trader.buyOrders = [];
    trader.tokenPairsParticipated = [];
    trader.tokensParticipated = [];
    trader.tokenAuctionBalances = [];
  }
  trader.lastActive = event.block.timestamp;
  trader.save();

  // Token SECTION
  let token = Token.load(params.token.toHex());
  if (token == null) {
    token = new Token(params.token.toHex());
    token.sellOrders = [];
    token.buyOrders = [];
    token.traders = [];
    token.tokenPairs = [];
    token.whitelisted = false;
  }
  let tokenTradersMemory = token.traders;
  if (!checkIfValueExistsInArray(tokenTradersMemory, trader.id)) {
    tokenTradersMemory[tokenTradersMemory.length] = trader.id;
    token.traders = tokenTradersMemory;
  }
  token.save();
}
