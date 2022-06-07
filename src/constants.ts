import { ethers } from 'hardhat';

export const DRAW_BUFFER_CARDINALITY = 255;
export const PRIZE_DISTRIBUTION_BUFFER_CARDINALITY = 180; // six months
export const PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST = 1000000; // 1 USDC

export const BEACON_START_TIME = Math.floor(new Date('2021-11-3T19:00:00.000Z').getTime() / 1000);
export const BEACON_PERIOD_SECONDS = 86400; // one day

export const SALES_RATE_PER_SECOND = ethers.utils.parseEther('1000000'); // million per second (no overhead)
export const END_TIMESTAMP_OFFSET = 15 * 60; // 15 minutes
export const RNG_TIMEOUT_SECONDS = 2 * 3600; // 2 hours
export const EXPIRY_DURATION = 60 * 86400; // 2 months
export const ONE_YEAR_IN_SECONDS = 31557600;

export const DAI_TOKEN_DECIMALS = 18;
export const USDC_TOKEN_DECIMALS = 6;

export const POOL_USDC_MARKET_RATE = '1.0';
