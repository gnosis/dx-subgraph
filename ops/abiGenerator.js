const fs = require('fs');

const contract = JSON.parse(
  fs.readFileSync('node_modules/@gnosis.pm/dx-contracts/build/contracts/DutchExchange.json', 'utf8')
);

fs.writeFileSync('./abis/DutchExchange.json', JSON.stringify(contract.abi));
console.log(JSON.stringify(contract.abi));
