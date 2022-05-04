// @ts-nocheck
import { dim, yellow, green } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DRAW_BUFFER_CARDINALITY,
  RNG_TIMEOUT_SECONDS,
  POOL_USDC_MARKET_RATE,
  SALES_RATE_PER_SECOND,
  TOKEN_DECIMALS
} from '../src/constants';
import { deployAndLog } from '../src/deployAndLog';
import { setManager } from '../src/setManager';
import { ethers } from 'hardhat';

const GaugeControllerJson = require('../submodules/pool-tokenomics-prototype/out/GaugeController.sol/GaugeController.json')
const DrawCalculatorJson = require('../submodules/pool-tokenomics-prototype/out/DrawCalculator.sol/DrawCalculator.json')
const PrizeDistributorJson = require('../submodules/pool-tokenomics-prototype/out/PrizeDistributor.sol/PrizeDistributor.json')
const PrizePoolLiquidatorJson = require('../submodules/pool-tokenomics-prototype/out/PrizePoolLiquidator.sol/PrizePoolLiquidator.json')

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

  const prizePool1Result = await deployAndLog('PrizePool1', {
    contract: 'YieldSourcePrizePool',
    from: deployer,
    args: [deployer, mockYieldSourceResult.address],
    skipIfAlreadyDeployed: true,
  });

  const ticket1Result = await deployAndLog('Ticket1', {
    contract: 'Ticket',
    from: deployer,
    args: ['Ticket', 'TICK', TOKEN_DECIMALS, prizePool1Result.address],
    skipIfAlreadyDeployed: true,
  });

  // Prize Pool 2

  const prizePool2Result = await deployAndLog('PrizePool2', {
    contract: 'YieldSourcePrizePool',
    from: deployer,
    args: [deployer, mockYieldSourceResult.address],
    skipIfAlreadyDeployed: true,
  });

  const ticket2Result = await deployAndLog('Ticket2', {
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
    skipIfAlreadyDeployed: true
  })

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
    skipIfAlreadyDeployed: true
  });

  const gaugeControllerResult = await deployAndLog('GaugeController', {
    from: deployer,
    contract: {
      abi: GaugeControllerJson.abi,
      bytecode: GaugeControllerJson.bytecode
    },
    args: [
      poolResult.address,
      deployer
    ],
    skipIfAlreadyDeployed: true,
  });

  const drawCalculatorResult = await deployAndLog('DrawCalculator', {
    from: deployer,
    contract: {
      abi: DrawCalculatorJson.abi,
      bytecode: DrawCalculatorJson.bytecode
    },
    args: [
      gaugeControllerResult.address,
      drawBufferResult.address,
      deployer
    ],
    skipIfAlreadyDeployed: true,
  });

  const prizeDistributorResult = await deployAndLog('PrizeDistributor', {
    from: deployer,
    contract: {
      abi: PrizeDistributorJson.abi,
      bytecode: PrizeDistributorJson.bytecode
    },
    args: [deployer, poolResult.address, drawCalculatorResult.address],
    skipIfAlreadyDeployed: true,
  });

  const prizePoolLiquidatorResult = await deployAndLog('PrizePoolLiquidator', {
    from: deployer,
    contract: {
      abi: PrizePoolLiquidatorJson.abi,
      bytecode: PrizePoolLiquidatorJson.bytecode
    },
    skipIfAlreadyDeployed: true,
  });

  await deployAndLog('EIP2612PermitAndDeposit', { from: deployer, skipIfAlreadyDeployed: true });

  await deployAndLog('TwabRewards', {
    from: deployer,
    args: [ticket1Result.address],
    skipIfAlreadyDeployed: true,
  });

  await deployAndLog('TWABDelegator', {
    from: deployer,
    args: ['PoolTogether Staked aUSDC Ticket', 'stkPTaUSDC', ticket1Result.address],
    skipIfAlreadyDeployed: true,
  });

  // ===================================================
  // Configure Contracts
  // ===================================================
  console.log(dim("Configuring contracts..."))

  
  const prizePool1 = await ethers.getContract('PrizePool1')
  console.log(`I am ${prizePool1.signer.address}`)
  if ((await prizePool1.getTicket()) != ticket1Result.address) {
    console.log(dim("Setting ticket on pool 1..."))
    await (await prizePool1.setTicket(ticket1Result.address)).wait(1)
  }
  if ((await prizePool1.getPrizeStrategy()) != prizePoolLiquidatorResult.address) {
    console.log(dim("Setting prize strat on pool 1..."))
    await (await prizePool1.setPrizeStrategy(prizePoolLiquidatorResult.address)).wait(1)
  }

  
  const prizePool2 = await ethers.getContract('PrizePool2')
  if ((await prizePool2.getTicket()) != ticket2Result.address) {
    console.log(dim("Setting ticket on pool 2..."))
    await (await prizePool2.setTicket(ticket2Result.address)).wait(1)
  }
  if ((await prizePool2.getPrizeStrategy()) != prizePoolLiquidatorResult.address) {
    console.log(dim("Setting prize strat on pool 2..."))
    await (await prizePool2.setPrizeStrategy(prizePoolLiquidatorResult.address)).wait(1)
  }

  await setManager('DrawBuffer', null, drawBeaconResult.address);

  console.log(dim(`Checking liquidation stream...`))
  const prizePoolLiquidator = await ethers.getContract('PrizePoolLiquidator')
  const sc = await prizePoolLiquidator.getStreamController('0')
  if (sc.exchangeRate == 0) {
    console.log(dim(`Adding stream for prize pool 1....`))
    await (await prizePoolLiquidator.addStream(
      prizePool1Result.address,
      prizeDistributorResult.address,
      ticket1Result.address,
      poolResult.address,
      ethers.utils.parseEther(POOL_USDC_MARKET_RATE),
      SALES_RATE_PER_SECOND,
      ethers.utils.parseEther('0.01').div(60), // 1% every minute
      ethers.utils.parseEther('0.05') // 5% slippage
    )).wait(1)

    console.log(dim(`Adding stream for prize pool 2....`))
    await (await prizePoolLiquidator.addStream(
      prizePool2Result.address,
      prizeDistributorResult.address,
      ticket2Result.address,
      poolResult.address,
      ethers.utils.parseEther(POOL_USDC_MARKET_RATE),
      SALES_RATE_PER_SECOND,
      ethers.utils.parseEther('0.01').div(60), // 1% every minute
      ethers.utils.parseEther('0.05') // 5% slippage
    )).wait(1)
  }

  const mockYieldSource = await ethers.getContract('MockYieldSource')
  const yieldTx = await mockYieldSource.setRatePerSecond(ethers.utils.parseEther('0.01').div(60)) // 1% every minute
  await yieldTx.wait(1)

  const pool = await ethers.getContract('Pool')
  if ((await pool.balanceOf(deployer)).eq('0')) {
    const mintTx = await pool.mint(deployer, ethers.utils.parseEther('10000000'))
    await mintTx.wait(1)
  }

  const gaugeController = await ethers.getContract('GaugeController')
  if (!(await gaugeController.isGauge(ticket1Result.address))) {
    console.log(dim(`Adding ticket1 as gauge...`))
    await (await gaugeController.addGauge(ticket1Result.address)).wait(1)

    console.log(dim(`Adding ticket2 as gauge...`))
    await (await gaugeController.addGauge(ticket2Result.address)).wait(1)

    console.log(green(`Done adding gauges!`))
  }

  const drawCalculator = await ethers.getContract('DrawCalculator')
  if (await drawCalculator.count() == 0) {
    console.log(yellow(`Pushing first prize tier on....`))
    const pushTx = await drawCalculator.push({
      bitRangeSize: 2,
      matchCardinality: 12,
      maxPicksPerUser: 2,
      drawId: 1,
      expiryDuration: calculatedBeaconPeriodSeconds * 4, // expires in four periods
      endTimestampOffset: 0,
      poolStakeTotal: (await pool.totalSupply()),
      prize: ethers.utils.parseEther('10.0'),
      tiers: ['141787658', '85072595', '136116152', '136116152', '108892921', '217785843', '174228675', 0, 0, 0, 0, 0, 0, 0, 0, 0]
    })
    await pushTx.wait(1)
    console.log(green(`Done!`))
  }
}
