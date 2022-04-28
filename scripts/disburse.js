const chalk = require('chalk')
const hardhat = require("hardhat")

const { ethers } = hardhat

async function run() {

  const pool = await ethers.getContract('Pool')

  const yieldSource = await ethers.getContract('MockYieldSource')
  const token = await ethers.getContractAt('@pooltogether/v4-core/contracts/test/ERC20Mintable.sol:ERC20Mintable', (await yieldSource.depositToken()))
  const decimals = await token.decimals()

  const signers = await ethers.getSigners()

  const addresses = process.env.DISBURSE_ADDRESSES.split(',')

  const mintTokenTo = [
    signers[0].address,
    ...addresses
  ]

  console.log(chalk.yellow(`Disbursing token ${token.address}...`))

  for (let index = 0; index < mintTokenTo.length; index++) {
    const amount = ethers.utils.parseUnits('10000', decimals)
    console.log(chalk.dim(`Minting ${ethers.utils.formatEther(amount)} deposit tokens to ${mintTokenTo[index]}...`))
    await token.mint(mintTokenTo[index], amount)
    console.log(chalk.dim(`Transferring ${ethers.utils.formatEther(amount)} POOL tokens to ${mintTokenTo[index]}...`))
    await pool.transfer(mintTokenTo[index], amount)
  }
}

run()