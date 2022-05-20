// @ts-nocheck
import { dim, yellow, green } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DRAW_BUFFER_CARDINALITY,
  RNG_TIMEOUT_SECONDS,
  POOL_USDC_MARKET_RATE,
  SALES_RATE_PER_SECOND,
  TOKEN_DECIMALS,
} from '../src/constants';
import { deployAndLog } from '../src/deployAndLog';
import { setManager } from '../src/setManager';
import { ethers } from 'hardhat';

export default async function deployToMumbai(hardhat: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hardhat;

  const { deployer, defenderRelayer } = await getNamedAccounts();

  // ===================================================
  // Deploy Contracts
  // ===================================================

  const mockYieldSourceResult = await deployAndLog('MockYieldSource', {
    from: deployer,
    args: ['Token', 'TOK', TOKEN_DECIMALS],
    skipIfAlreadyDeployed: true,
  });

  // Prize Pool 1

  const prizePool1Result = await deployAndLog('PrizePool-1', {
    contract: 'YieldSourcePrizePool',
    from: deployer,
    args: [deployer, mockYieldSourceResult.address],
    skipIfAlreadyDeployed: true,
  });

  const ticket1Result = await deployAndLog('Ticket-1', {
    contract: 'Ticket',
    from: deployer,
    args: ['Ticket', 'TICK', TOKEN_DECIMALS, prizePool1Result.address],
    skipIfAlreadyDeployed: true,
  });

  // Prize Pool 2

  const prizePool2Result = await deployAndLog('PrizePool-2', {
    contract: 'YieldSourcePrizePool',
    from: deployer,
    args: [deployer, mockYieldSourceResult.address],
    skipIfAlreadyDeployed: true,
  });

  const ticket2Result = await deployAndLog('Ticket-2', {
    contract: 'Ticket',
    from: deployer,
    args: ['Ticket', 'TICK', TOKEN_DECIMALS, prizePool2Result.address],
    skipIfAlreadyDeployed: true,
  });

  // ----------------------

  const poolResult = await deployAndLog('Pool', {
    from: deployer,
    contract: '@pooltogether/v4-core/contracts/test/ERC20Mintable.sol:ERC20Mintable',
    args: ['POOL Token', 'POOL'],
    skipIfAlreadyDeployed: true,
  });

  const drawBufferResult = await deployAndLog('DrawBuffer', {
    from: deployer,
    args: [deployer, DRAW_BUFFER_CARDINALITY],
    skipIfAlreadyDeployed: true,
  });

  const rngServiceResult = await deployAndLog('RNGBlockhash', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  // New Draw Every 10 minutes
  const calculatedBeaconPeriodSeconds = 600;

  const drawBeaconResult = await deployAndLog('DrawBeacon', {
    from: deployer,
    args: [
      deployer,
      drawBufferResult.address,
      rngServiceResult.address,
      1,
      (await ethers.provider.getBlock('latest')).timestamp,
      calculatedBeaconPeriodSeconds,
      RNG_TIMEOUT_SECONDS,
    ],
    skipIfAlreadyDeployed: true,
  });

  const gaugeControllerResult = await deployAndLog('GaugeController', {
    from: deployer,
    args: [poolResult.address, deployer],
    skipIfAlreadyDeployed: true,
  });

  const prizeConfigHistoryResult = await deployAndLog('PrizeConfigHistory', {
    from: deployer,
    args: [deployer],
    skipIfAlreadyDeployed: true,
  });

  const drawCalculatorResult = await deployAndLog('DrawCalculatorV3', {
    from: deployer,
    args: [
      gaugeControllerResult.address,
      drawBufferResult.address,
      prizeConfigHistoryResult.address,
      deployer,
    ],
    skipIfAlreadyDeployed: true,
  });

  const vaultResult = await deployAndLog('Vault', {
    from: deployer,
    args: [deployer],
    skipIfAlreadyDeployed: true,
  });

  const prizeDistributorResult = await deployAndLog('PrizeDistributorV2', {
    from: deployer,
    args: [deployer, poolResult.address, drawCalculatorResult.address, vaultResult.address],
    skipIfAlreadyDeployed: true,
  });

  const prizePoolLiquidatorResult = await deployAndLog('PrizePoolLiquidator', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  // ===================================================
  // Configure Contracts
  // ===================================================
  console.log(dim('Configuring contracts...'));

  const prizePool1 = await ethers.getContract('PrizePool-1');
  if ((await prizePool1.getTicket()) != ticket1Result.address) {
    console.log(dim('Setting ticket on pool 1...'));
    await (await prizePool1.setTicket(ticket1Result.address)).wait(1);
  }
  if ((await prizePool1.getPrizeStrategy()) != prizePoolLiquidatorResult.address) {
    console.log(dim('Setting prize strat on pool 1...'));
    await (await prizePool1.setPrizeStrategy(prizePoolLiquidatorResult.address)).wait(1);
  }

  const prizePool2 = await ethers.getContract('PrizePool-2');
  if ((await prizePool2.getTicket()) != ticket2Result.address) {
    console.log(dim('Setting ticket on pool 2...'));
    await (await prizePool2.setTicket(ticket2Result.address)).wait(1);
  }
  if ((await prizePool2.getPrizeStrategy()) != prizePoolLiquidatorResult.address) {
    console.log(dim('Setting prize strat on pool 2...'));
    await (await prizePool2.setPrizeStrategy(prizePoolLiquidatorResult.address)).wait(1);
  }

  await setManager('DrawBuffer', null, drawBeaconResult.address);

  const mockYieldSource = await ethers.getContract('MockYieldSource');
  if ((await mockYieldSource.ratePerSecond()).eq('0')) {
    console.log(dim('Setting yield rate...'));
    const yieldTx = await mockYieldSource.setRatePerSecond(ethers.utils.parseEther('0.01').div(60)); // 1% every minute
    await yieldTx.wait(1);
  }

  const pool = await ethers.getContract('Pool');
  if ((await pool.balanceOf(deployer)).eq('0')) {
    console.log(dim('Minting POOL to deployer...'));
    const mintTx = await pool.mint(deployer, ethers.utils.parseEther('10000000'));
    await mintTx.wait(1);
  }

  const gaugeController = await ethers.getContract('GaugeController');
  if (!(await gaugeController.isGauge(ticket1Result.address))) {
    console.log(dim(`Adding ticket1 as gauge...`));
    await (await gaugeController.addGauge(ticket1Result.address)).wait(1);

    console.log(dim(`Adding ticket2 as gauge...`));
    await (await gaugeController.addGauge(ticket2Result.address)).wait(1);

    console.log(green(`Done adding gauges!`));
  }

  const prizeConfigHistory = await ethers.getContract('PrizeConfigHistory');

  if ((await prizeConfigHistory.count()) == 0) {
    console.log(yellow(`Pushing first prize tier on....`));

    const pushTx = await prizeConfigHistory.push({
      bitRangeSize: 2,
      matchCardinality: 12,
      maxPicksPerUser: 2,
      drawId: 1,
      expiryDuration: calculatedBeaconPeriodSeconds * 4, // expires in four periods
      endTimestampOffset: 0,
      poolStakeCeiling: await pool.totalSupply(),
      prize: ethers.utils.parseEther('10.0'),
      tiers: [
        '141787658',
        '85072595',
        '136116152',
        '136116152',
        '108892921',
        '217785843',
        '174228675',
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      ],
    });

    await pushTx.wait(1);
    console.log(green(`Done!`));
  }
}
