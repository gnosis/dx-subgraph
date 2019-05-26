// `truffle test --silent` or `truffle test -s` to suppress logs
const BigNumber = require('bignumber.js');

const AUCTION_START_WAITING_FOR_FUNDING = 1;

const { silent, contract: contractFlag, gas: gasLog, gasTx, noevents } = require('minimist')(
  process.argv.slice(2),
  { alias: { silent: 's', contract: 'c', gas: 'g', gasTx: 'gtx' } }
);

const log = silent ? () => {} : console.log.bind(console);
const logger = async (desc, fn) => {
  if (!silent) {
    let value;
    if (fn instanceof Promise) {
      value = await fn;
    } else {
      value = fn;
    }
    if (value instanceof BigNumber) {
      value = value.toNumber();
    }

    log(`---- \n => ${desc} ${value ? `|| - - - - - - - - - - - > ${value}` : ''}`);
  }
};

const varLogger = (varName, varValue) => log(varName, '--->', varValue);

/**
 * gasLogWrapper
 * @param {*} obj
 */
let totalGas = 0;
const gasLogWrapper = contracts => {
  const handler = {
    // intercept all GETS to contracts
    get(target, propKey) {
      const origMethod = target[propKey];
      // if prompted prop !== a FUNCTION return prop
      if (typeof origMethod !== 'function' || !origMethod.sendTransaction) {
        return origMethod;
      }
      // go one level deeper into actual METHOD - here access to (.call, .apply etc)
      return new Proxy(origMethod, {
        // called if @transaction function
        async apply(target, thisArg, argumentsList) {
          const result = await Reflect.apply(target, thisArg, argumentsList);
          // safeguards against constant functions and BigNumber returns
          if (typeof result !== 'object' || !result.receipt) return result;
          const {
            receipt: { gasUsed }
          } = result;
          // check that BOTH gas flags are used
          gasLog &&
            gasTx &&
            console.info(`
          ==============================
          TX name           ==> ${propKey}
          TX gasCost        ==> ${gasUsed}
          ==============================
          `);
          totalGas += gasUsed;
          return result;
        }
      });
    }
  };

  if (silent) {
    return contracts;
  } else {
    return contracts.map(c => new Proxy(c, handler));
  }
};

/**
 * gasLogger
 * @param {contracts from testFunctions} contracts
 */
const gasLogger = () => {
  gasLog &&
    console.info(`
    *******************************
    TOTAL GAS
    Gas ==> ${totalGas}
    *******************************
  `);
  // reset totalGas state
  totalGas = 0;
};

const assertRejects = async (q, msg) => {
  let res,
    catchFlag = false;
  try {
    res = await q;
    // checks if there was a Log event and its argument l contains string "R<number>"
    catchFlag =
      res.logs && !!res.logs.find(log => log.event === 'Log' && /\bR(\d+\.?)+/.test(log.args.l));
  } catch (e) {
    catchFlag = true;
  } finally {
    if (!catchFlag) {
      assert.fail(res, null, msg);
    }
  }
};

const blockNumber = () => web3.eth.blockNumber;

// keeps track of watched events
let stopWatching = {};
/**
 * eventWatcher                - ...watches events
 * @param {contract} contract  - dx, usually
 * @param {string} event       - name of event on DutchExchange.sol to track
 * @param {Object} args?       - not required, args to look for
 * @returns stopWatching function
 */
const eventWatcher = noevents
  ? () => {}
  : (contract, eventName, argum = {}) => {
      const eventFunc = contract[eventName];
      if (!eventFunc) {
        log(`No event ${eventName} available in the contract`);
        return null;
      }

      const eventObject = eventFunc(argum).watch((err, result) => {
        const { event, args } = result;
        if (err) return log(err);

        switch (event) {
          // const { args: { returned, tulipsIssued } } = result
          case 'LogNumber':
            return log(`
        LOG FOUND:
        ========================
        ${args.l} ==> ${Number(args.n).toEth()}
        ========================
        `);
          case 'ClaimBuyerFunds':
            return log(`
        LOG FOUND:
        ========================
        RETURNED      ==> ${Number(args.returned).toEth()}
        TULIPS ISSUED ==> ${Number(args.tulipsIssued).toEth()}
        ========================
        `);
          default:
            return log(`
        LOG FOUND:
        ========================
        Event Name: ${event}
        Args:
        ${JSON.stringify(args, undefined, 2)}
        ========================
        `);
        }
      });
      const contractEvents =
        stopWatching[contract.address] || (stopWatching[contract.address] = {});
      if (contractEvents[eventName]) contractEvents[eventName]();
      const unwatch = (contractEvents[eventName] = eventObject.stopWatching.bind(eventObject));

      return unwatch;
    };

/**
 * eventWatcher.stopWatching    - stops watching an event
 * @param {contract} contract?  - dx, ususally,
 *                                if none specified stops watching all contracts
 * @param {string} event?       - name of event to stop watching,
 *                                if none specified stops watching all events for this contract
 */
eventWatcher.stopWatching = noevents
  ? () => {}
  : (contract, event) => {
      // if given particular event name, stop watching it
      if (contract && typeof contract === 'object' && contract.address) {
        const contractEvents = stopWatching[contract.address];

        if (!contractEvents) {
          log('contract was never watched');
          return;
        }

        // if event isn't specified
        // stop watching all for this contract
        if (!event) {
          for (const ev of Object.keys(contractEvents)) {
            contractEvents[ev]();
          }
          delete stopWatching[contract.address];
          return;
        }

        // stop watching a single event
        const unwatch = contractEvents[event];
        if (unwatch) {
          unwatch();
          delete stopWatching[event];
        } else {
          log(`${event} event was never watched`);
        }

        return;
      }

      // otherwise stop watching all events
      const unwatchAll = () => {
        for (const key of Object.keys(stopWatching)) {
          const contractEvents = stopWatching[key];
          for (const ev of Object.keys(contractEvents)) {
            contractEvents[ev]();
          }
        }
        stopWatching = {};
      };

      // allow to be used as a direct input to mocha hooks (contract === done callback)
      if (typeof contract === 'function') {
        // don't wait if no events were watched
        if (!Object.keys(stopWatching).length) {
          contract();
          return;
        }
        // unwatch after a delay as not all events a typically has been displayed
        // in case of after() hook
        setTimeout(() => {
          unwatchAll();
          contract();
        }, 500);
      } else unwatchAll();
    };

const enableContractFlag = (...contractTests) => {
  const cTest = contractTests[contractFlag - 1];
  if (cTest) cTest();
  else contractTests.forEach(c => c());
};

const makeSnapshot = () => {
  return web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_snapshot'
  }).result;
};

const revertSnapshot = snapshotId => {
  web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_revert',
    params: [snapshotId]
  });
};

// Identifier Utils
const auctionId = (sellToken, buyToken, auctionIndex) => {
  return (sellToken + '-' + buyToken + '-' + auctionIndex.toString()).toLowerCase();
};

const tokenPairId = (sellToken, buyToken) => {
  return (sellToken + '-' + buyToken).toLowerCase();
};

const tokenBalanceId = (trader, token) => {
  return (trader + '-' + token).toLowerCase();
};

const tokenAuctionBalanceId = (trader, auctionId) => {
  return (trader + '-' + auctionId).toLowerCase();
};

// export function transactionId(
//   transactionHash: ByteArray,
//   token: ByteArray,
//   amount: ByteArray
// ): string {
//   let firstIdentifierPart = concat(transactionHash, token);
//   let identifier = concat(firstIdentifierPart, amount);
//   return crypto.keccak256(identifier).toHex();
// }

// Digix Tempo updated
const sendRpc = (method, params) => {
  return new Promise(resolve => {
    web3.currentProvider.send(
      {
        jsonrpc: '2.0',
        method,
        params: params || [],
        id: new Date().getTime()
      },
      (err, res) => {
        resolve(res);
      }
    );
  });
};
const waitUntilBlock = (seconds, targetBlock) => {
  return new Promise(resolve => {
    const asyncIterator = () => {
      return web3.eth.getBlock('latest', (e, { number }) => {
        if (number >= targetBlock - 1) {
          return sendRpc('evm_increaseTime', [seconds])
            .then(() => sendRpc('evm_mine'))
            .then(resolve);
        }
        return sendRpc('evm_mine').then(asyncIterator);
      });
    };
    asyncIterator();
  });
};
const wait = (seconds = 20, blocks = 1) => {
  return new Promise(resolve => {
    return web3.eth.getBlock('latest', (e, { number }) => {
      resolve(blocks + number);
    });
  }).then(targetBlock => {
    return waitUntilBlock(seconds, targetBlock);
  });
};

module.exports = {
  AUCTION_START_WAITING_FOR_FUNDING,
  silent,
  assertRejects,
  blockNumber,
  enableContractFlag,
  eventWatcher,
  gasLogger,
  gasLogWrapper,
  log,
  logger,
  varLogger,
  makeSnapshot,
  revertSnapshot,
  auctionId,
  tokenPairId,
  tokenBalanceId,
  tokenAuctionBalanceId,
  wait,
  waitUntilBlock
};
