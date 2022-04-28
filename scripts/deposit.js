const chalk = require('chalk')
const hardhat = require("hardhat")
const { ethers } = hardhat

async function run() {

  const yieldSource = await ethers.getContract('MockYieldSource')
  const token = await ethers.getContractAt('@pooltogether/yield-source-interface/contracts/test/ERC20Mintable.sol:ERC20Mintable', (await yieldSource.depositToken()))
  const prizePool = await ethers.getContract('PrizePool1')

  const signers = await ethers.getSigners()

  const decimals = await token.decimals()

  const amount = ethers.utils.parseUnits('100', decimals)

  console.log(chalk.dim(`Approving prize spend...`))
  const tx = await token.approve(prizePool.address, amount)
  await tx.wait(1)

  console.log(chalk.dim(`Depositing into prize pool 1 ${prizePool.address}...`))
  const depositTx = await prizePool.depositToAndDelegate(signers[0].address, amount, signers[0].address)
  await depositTx.wait(1)

}

run()
