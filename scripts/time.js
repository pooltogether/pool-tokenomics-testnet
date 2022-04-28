const chalk = require('chalk')
const hardhat = require("hardhat")

const { ethers } = hardhat

async function run() {
    console.log(chalk.cyan(`Current time is ${(await ethers.provider.getBlock('latest')).timestamp.toString()}`))
}

run()