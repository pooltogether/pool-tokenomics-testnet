#!/usr/bin/env node
import chalk from 'chalk';
import find from 'find';
import fs from 'fs';
import hardhat from 'hardhat';
import { verifyAddress } from './helpers/verifyAddress';

const info = (msg: any) => console.log(chalk.dim(msg));
const success = (msg: any) => console.log(chalk.green(msg));
const error = (msg: any) => console.error(chalk.red(msg));

async function run() {
  const network = hardhat.network.name;

  info(`Verifying Smart Contracts on network: ${network}`);

  const filePath = './deployments/' + network + '/';
  let toplevelContracts: Array<any> = [];

  // read deployment JSON files
  fs.readdirSync(filePath).filter((fileName: any) => {
    if (fileName.includes('.json')) {
      const deployName = fileName.substring(0, fileName.length - 5).trim(); // strip .json
      let contractName = '';

      switch (deployName) {
        case 'Pool':
          contractName = 'ERC20Mintable';
          break;

        case 'PrizePool-1':
          contractName = 'YieldSourcePrizePool';
          break;

        case 'PrizePool-2':
          contractName = 'YieldSourcePrizePool';
          break;

        case 'Ticket-1':
          contractName = 'Ticket';
          break;

        case 'Ticket-2':
          contractName = 'Ticket';
          break;

        case 'Vault':
          contractName = 'TokenVault';
          break;

        default:
          contractName = deployName;
          break;
      }

      const contractDirPath = find.fileSync(
        contractName + '.sol',
        './node_modules/@pooltogether/',
      )[0];

      console.log("contractName", contractName);

      if (!contractDirPath) {
        error(`There is no matching contract for ${contractName}. This is likely because the deployment contract name is different from the Solidity contract title.
         Run verification manually. See verifyEtherscanClone() for details`);
        return;
      }

      const deployment = JSON.parse(fs.readFileSync(filePath + fileName, 'utf8'));

      toplevelContracts.push({
        address: deployment.address,
        contractPath: contractDirPath + ':' + contractName,
        contractName,
        constructorArgs: deployment.args,
      });
    }
  });

  info(`Attempting to verify ${toplevelContracts.length} smart contracts`);

  for (let index = 0; index < toplevelContracts.length; index++) {
    const contract = toplevelContracts[index];
    let args = '';
    let argsArray: Array<any> = [];
    if (contract.constructorArgs.length > 0) {
      contract.constructorArgs.forEach((arg: any) => {
        args = args.concat('"', arg, '" '); // format constructor args in correct form - "arg" "arg"
        argsArray.push(arg);
      });
    }
    await verifyAddress(hardhat, contract.address, argsArray);
  }

  success('Done!');
}
run();
