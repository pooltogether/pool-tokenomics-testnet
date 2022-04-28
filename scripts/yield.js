const chalk = require('chalk')
const hardhat = require("hardhat")

const { ethers } = hardhat

async function run() {

  const yieldSource = await ethers.getContract('MockYieldSource')
  const token = await ethers.getContractAt('@pooltogether/v4-core/contracts/test/ERC20Mintable.sol:ERC20Mintable', (await yieldSource.depositToken()))

  const balance = await token.balanceOf(yieldSource.address)

  // yield is 2% of balance
  const yield = balance.div(50)

  console.log(chalk.yellow(`Yielding ${ethers.utils.formatEther(yield)}...`))
  await yieldSource.yield(yield)
}

run()