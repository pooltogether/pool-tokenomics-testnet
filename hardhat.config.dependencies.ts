export const external = {
  contracts: [
    {
      artifacts: 'node_modules/@pooltogether/v4-core/artifacts',
    },
    {
      artifacts: 'node_modules/@pooltogether/pooltogether-rng-contracts/build',
    },
    {
      artifacts: 'node_modules/@pooltogether/yield-source-interface/artifacts',
    },
  ],
  deployments: {
    rinkeby: ['node_modules/@pooltogether/pooltogether-rng-contracts/deployments/rinkeby'],
    mumbai: ['node_modules/@pooltogether/pooltogether-rng-contracts/deployments/mumbai_80001'],
  },
};
export const dependencyCompiler = {
  paths: [
    // V4 Core
    '@pooltogether/v4-core/contracts/test/ERC20Mintable.sol',
    // Timelock
    '@pooltogether/v4-timelocks/contracts/L1TimelockTrigger.sol',
    '@pooltogether/v4-timelocks/contracts/L2TimelockTrigger.sol',
    '@pooltogether/v4-timelocks/contracts/DrawCalculatorTimelock.sol',
    '@pooltogether/v4-timelocks/contracts/BeaconTimelockTrigger.sol',
    '@pooltogether/v4-timelocks/contracts/ReceiverTimelockTrigger.sol',
    // Periphery
    '@pooltogether/v4-periphery/contracts/PrizeFlush.sol',
    '@pooltogether/v4-periphery/contracts/PrizeTierHistory.sol',
    '@pooltogether/v4-periphery/contracts/PrizeDistributionFactory.sol',
    '@pooltogether/v4-periphery/contracts/TwabRewards.sol',
    // TWAB Delegator
    '@pooltogether/v4-twab-delegator/contracts/TWABDelegator.sol',
    // Chainlink VRF
    '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol',
    // RNG Service
    '@pooltogether/pooltogether-rng-contracts/contracts/RNGChainlinkV2.sol',
    '@pooltogether/pooltogether-rng-contracts/contracts/RNGBlockhash.sol',
    // mock yield source
    '@pooltogether/yield-source-interface/contracts/test/MockYieldSource.sol',
  ],
};
