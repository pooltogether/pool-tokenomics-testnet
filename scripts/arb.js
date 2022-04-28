const { dim, yellow, green } = require('chalk')
const hardhat = require("hardhat")

const { POOL_USDC_MARKET_RATE } = require('../src/constants')
const { ethers } = hardhat

function computeTradeProfit(amountA, amountB, marketRate) {
    const costInA = amountB.mul(marketRate).div(ethers.constants.WeiPerEther)
    const profit = amountA.gt(costInA) ? amountA.sub(costInA) : ethers.BigNumber.from('0');
    return profit;
}

async function arb(streamId, marketRate) {
    const prizeDistributor = await ethers.getContract('PrizeDistributor')
    const liquidator = await ethers.getContract('PrizePoolLiquidator')
    const pool = await ethers.getContract('Pool')
    await pool.approve(liquidator.address, ethers.constants.MaxUint256)
  
    const availableBalance = await liquidator.callStatic.availableBalanceOf(streamId)
    console.log(dim(`Available balance: ${ethers.utils.formatEther(availableBalance)}`))
  
    const stepSize = availableBalance.div(10)
    let currentAmount = ethers.BigNumber.from('0');
    let currentProfit = ethers.BigNumber.from('0');
    let amount = stepSize;
      while (amount.lt(availableBalance)) {
          const amountB = await liquidator.callStatic.computeExactAmountOut(streamId, amount)
          const profit = await computeTradeProfit(amount, amountB, marketRate)
          if (profit.gt(currentProfit)) {
              currentAmount = amountB
              currentProfit = profit
          }
          amount = amount.add(stepSize);
      }

      const streamPrefix = `Arb stream[${streamId}]:`
    
      const exchangeRate = await liquidator.callStatic.currentExchangeRate(streamId)
      console.log(dim(`${streamPrefix} Exchange rate: ${ethers.utils.formatEther(exchangeRate)}`))
  
      // if profit greater than 1, arb
      if (currentProfit.gt(ethers.utils.parseEther('0.1'))) {
          console.log(dim(`${streamPrefix} Prize distributor balance: ${ethers.utils.formatEther(await pool.balanceOf(prizeDistributor.address))}`))
          const amountOut = await liquidator.callStatic.computeExactAmountOut(streamId, currentAmount)
          console.log(green(`${streamPrefix} amount in: ${ethers.utils.formatEther(currentAmount)} amount out: ${ethers.utils.formatEther(amountOut)} with profit ${ethers.utils.formatEther(currentProfit)}...`))
  
          await liquidator.swapExactAmountIn(streamId, currentAmount)
          console.log(dim(`${streamPrefix} Arbed!  Prize distributor new balance: ${ethers.utils.formatEther(await pool.balanceOf(prizeDistributor.address))}`))
      } else {
          console.log(yellow(`${streamPrefix} Best trade: ${ethers.utils.formatEther(currentAmount)} with profit ${ethers.utils.formatEther(currentProfit)}`))
      }
}

async function run() {
  await ethers.provider.send("evm_mine")

  await arb('0', ethers.utils.parseEther(POOL_USDC_MARKET_RATE))
    
}

run()