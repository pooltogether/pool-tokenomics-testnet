import { dim, yellow, green } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DRAW_BUFFER_CARDINALITY,
  RNG_TIMEOUT_SECONDS,
  POOL_USDC_MARKET_RATE,
  SALES_RATE_PER_SECOND,
  ONE_YEAR_IN_SECONDS,
  DAI_TOKEN_DECIMALS,
  USDC_TOKEN_DECIMALS,
} from '../src/constants';
import { deployAndLog } from '../src/deployAndLog';
import { setManager } from '../src/setManager';
import { ethers } from 'hardhat';

const erc20MintableContractPath =
  '@pooltogether/v4-core/contracts/test/ERC20Mintable.sol:ERC20Mintable';

export default async function deployToMumbai(hardhat: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hardhat;

  const { deployer } = await getNamedAccounts();
  const { constants, getContract, getContractAt, utils } = ethers;
  const { AddressZero } = constants;
  const { parseEther: toWei, parseUnits } = utils;

  // ===================================================
  // Deploy Contracts
  // ===================================================

  // Prize Pool 1 - USDC-style asset (6 decimals) with low APY (5%)

  const mockYieldSource1Result = await deployAndLog('MockYieldSource-1', {
    from: deployer,
    contract: 'MockYieldSource',
    args: ['PoolTogether USDC Token 5% APY', 'PTUSDC5', USDC_TOKEN_DECIMALS],
    skipIfAlreadyDeployed: true,
  });

  const prizePool1Result = await deployAndLog('PrizePool-1', {
    contract: 'YieldSourcePrizePool',
    from: deployer,
    args: [deployer, mockYieldSource1Result.address],
    skipIfAlreadyDeployed: true,
  });

  const ticket1Result = await deployAndLog('Ticket-1', {
    contract: 'Ticket',
    from: deployer,
    args: [
      'PoolTogether aUSDC Ticket 5% APY',
      'PTaUSDC5',
      USDC_TOKEN_DECIMALS,
      prizePool1Result.address,
    ],
    skipIfAlreadyDeployed: true,
  });

  // Prize Pool 2 - DAI-style asset (18 decimals) with medium APY (10%)

  const mockYieldSource2Result = await deployAndLog('MockYieldSource-2', {
    from: deployer,
    contract: 'MockYieldSource',
    args: ['PoolTogether DAI Token 10% APY', 'PTDAI10', DAI_TOKEN_DECIMALS],
    skipIfAlreadyDeployed: true,
  });

  const prizePool2Result = await deployAndLog('PrizePool-2', {
    contract: 'YieldSourcePrizePool',
    from: deployer,
    args: [deployer, mockYieldSource2Result.address],
    skipIfAlreadyDeployed: true,
  });

  const ticket2Result = await deployAndLog('Ticket-2', {
    contract: 'Ticket',
    from: deployer,
    args: [
      'PoolTogether aDAI Ticket 10% APY',
      'PTaDAI10',
      DAI_TOKEN_DECIMALS,
      prizePool2Result.address,
    ],
    skipIfAlreadyDeployed: true,
  });

  // Prize Pool 3 - USDC-style asset (6 decimals) with high APY (15%)

  const mockYieldSource3Result = await deployAndLog('MockYieldSource-3', {
    from: deployer,
    contract: 'MockYieldSource',
    args: ['PoolTogether USDC Token 15% APY', 'PTUSDC15', USDC_TOKEN_DECIMALS],
    skipIfAlreadyDeployed: true,
  });

  const prizePool3Result = await deployAndLog('PrizePool-3', {
    contract: 'YieldSourcePrizePool',
    from: deployer,
    args: [deployer, mockYieldSource3Result.address],
    skipIfAlreadyDeployed: true,
  });

  const ticket3Result = await deployAndLog('Ticket-3', {
    contract: 'Ticket',
    from: deployer,
    args: [
      'PoolTogether aUSDC Ticket 15% APY',
      'PTaUSDC15',
      USDC_TOKEN_DECIMALS,
      prizePool3Result.address,
    ],
    skipIfAlreadyDeployed: true,
  });

  // ----------------------

  const poolResult = await deployAndLog('Pool', {
    from: deployer,
    contract: erc20MintableContractPath,
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

  const tokenVaultResult = await deployAndLog('TokenVault', {
    from: deployer,
    args: [deployer],
    skipIfAlreadyDeployed: true,
  });

  const prizeDistributorResult = await deployAndLog('PrizeDistributorV2', {
    from: deployer,
    args: [deployer, poolResult.address, drawCalculatorResult.address, tokenVaultResult.address],
    skipIfAlreadyDeployed: true,
  });

  const prizePoolLiquidatorResult = await deployAndLog('PrizePoolLiquidator', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  const gaugeRewardResult = await deployAndLog('GaugeReward', {
    from: deployer,
    args: [
      gaugeControllerResult.address,
      tokenVaultResult.address,
      prizePoolLiquidatorResult.address,
      parseUnits('0.1', 9), // 10%
    ],
    skipIfAlreadyDeployed: true,
  });

  // ===================================================
  // Configure Contracts
  // ===================================================
  console.log(dim('Configuring contracts...'));

  // Prize Pool 1 - USDC-style asset (6 decimals) with low APY (5%)

  const prizePool1 = await getContract('PrizePool-1');

  if ((await prizePool1.getTicket()) != ticket1Result.address) {
    console.log(dim('Setting ticket on pool 1...'));
    await (await prizePool1.setTicket(ticket1Result.address)).wait(1);
  }

  if ((await prizePool1.getPrizeStrategy()) != prizePoolLiquidatorResult.address) {
    console.log(dim('Setting prize strategy on pool 1...'));
    await (await prizePool1.setPrizeStrategy(prizePoolLiquidatorResult.address)).wait(1);
  }

  const mockYieldSource1 = await getContractAt('MockYieldSource', mockYieldSource1Result.address);
  const ptUSDC5 = await getContractAt(
    erc20MintableContractPath,
    await mockYieldSource1.depositToken(),
  );

  if ((await mockYieldSource1.ratePerSecond()).eq('0')) {
    console.log(dim('Setting APY of first PoolTogether USDC Yield Source to 5%...'));
    await mockYieldSource1.setRatePerSecond(toWei('0.05').div(ONE_YEAR_IN_SECONDS)); // 5% APY
  }

  if ((await ptUSDC5.balanceOf(deployer)).eq('0')) {
    console.log(dim('Minting 40M PTUSDC5 to deployer...'));
    await ptUSDC5.mint(deployer, parseUnits('40000000', USDC_TOKEN_DECIMALS)); // 40M
  }

  // Prize Pool 2 - DAI-style asset (18 decimals) with medium APY (10%)

  const prizePool2 = await getContract('PrizePool-2');

  if ((await prizePool2.getTicket()) != ticket2Result.address) {
    console.log(dim('Setting ticket on pool 2...'));
    await (await prizePool2.setTicket(ticket2Result.address)).wait(1);
  }

  if ((await prizePool2.getPrizeStrategy()) != prizePoolLiquidatorResult.address) {
    console.log(dim('Setting prize strategy on pool 2...'));
    await (await prizePool2.setPrizeStrategy(prizePoolLiquidatorResult.address)).wait(1);
  }

  const mockYieldSource2 = await getContractAt('MockYieldSource', mockYieldSource2Result.address);
  const ptDAI10 = await getContractAt(
    erc20MintableContractPath,
    await mockYieldSource2.depositToken(),
  );

  if ((await mockYieldSource2.ratePerSecond()).eq('0')) {
    console.log(dim('Setting APY of PoolTogether DAI Yield Source to 10%...'));
    await mockYieldSource2.setRatePerSecond(toWei('0.1').div(ONE_YEAR_IN_SECONDS)); // 10% APY
  }

  if ((await ptDAI10.balanceOf(deployer)).eq('0')) {
    console.log(dim('Minting 40M PTDAI10 to deployer...'));
    await ptDAI10.mint(deployer, parseUnits('40000000', DAI_TOKEN_DECIMALS)); // 40M
  }

  // Prize Pool 3 - USDC-style asset (6 decimals) with high APY (15%)

  const prizePool3 = await getContract('PrizePool-3');

  if ((await prizePool3.getTicket()) != ticket3Result.address) {
    console.log(dim('Setting ticket on pool 3...'));
    await (await prizePool3.setTicket(ticket3Result.address)).wait(1);
  }

  if ((await prizePool3.getPrizeStrategy()) != prizePoolLiquidatorResult.address) {
    console.log(dim('Setting prize strategy on pool 3...'));
    await (await prizePool3.setPrizeStrategy(prizePoolLiquidatorResult.address)).wait(1);
  }

  const mockYieldSource3 = await getContractAt('MockYieldSource', mockYieldSource3Result.address);
  const ptUSDC15 = await getContractAt(
    erc20MintableContractPath,
    await mockYieldSource3.depositToken(),
  );

  if ((await mockYieldSource3.ratePerSecond()).eq('0')) {
    console.log(dim('Setting APY of second PoolTogether USDC Yield Source to 15%...'));
    await mockYieldSource3.setRatePerSecond(toWei('0.15').div(ONE_YEAR_IN_SECONDS)); // 15% APY
  }

  if ((await ptUSDC15.balanceOf(deployer)).eq('0')) {
    console.log(dim('Minting 40M PTUSDC15 to deployer...'));
    await ptUSDC15.mint(deployer, parseUnits('40000000', USDC_TOKEN_DECIMALS)); // 40M
  }

  const pool = await getContract('Pool');

  if (poolResult.newlyDeployed) {
    console.log(dim('Minting 10M POOL to deployer...'));
    await pool.mint(deployer, toWei('10000000')); // 10M
  }

  await setManager('DrawBuffer', null, drawBeaconResult.address);

  const gaugeController = await getContract('GaugeController');

  if ((await gaugeController.callStatic.gaugeReward()) === AddressZero) {
    console.log(dim('Set GaugeReward contract on GaugeController...'));
    await gaugeController.setGaugeReward(gaugeRewardResult.address);
  }

  if (!(await gaugeController.isGauge(ticket1Result.address))) {
    console.log(dim(`Adding ticket1 as gauge...`));
    await gaugeController.addGauge(ticket1Result.address);
  }

  if (!(await gaugeController.isGauge(ticket2Result.address))) {
    console.log(dim(`Adding ticket2 as gauge...`));
    await gaugeController.addGauge(ticket2Result.address);
  }

  if (!(await gaugeController.isGauge(ticket3Result.address))) {
    console.log(dim(`Adding ticket3 as gauge...`));
    await gaugeController.addGauge(ticket3Result.address);
  }

  console.log(green(`Done adding gauges!`));

  const prizeConfigHistory = await getContract('PrizeConfigHistory');

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
