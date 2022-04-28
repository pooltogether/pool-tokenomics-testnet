const chalk = require('chalk')
const hardhat = require("hardhat")
const { ethers } = hardhat

async function run() {

    const drawBeacon = await ethers.getContract('DrawBeacon')

    const remainingTime = await drawBeacon.beaconPeriodRemainingSeconds()
    if (remainingTime > 0) {
        console.log(chalk.cyan(`Moving time forward ${remainingTime} seconds`))
        await ethers.provider.send('evm_increaseTime', [remainingTime.toNumber() + 1])
        await ethers.provider.send('evm_mine')
    }
    const drawId = await drawBeacon.getNextDrawId()

    if (await drawBeacon.canStartDraw()) {
        console.log(chalk.dim(`Starting draw ${drawId}....`))
        const startTx = await drawBeacon.startDraw()
        await startTx.wait(1)
    }

    await ethers.provider.send('evm_mine')
    await ethers.provider.send('evm_mine')

    if (await drawBeacon.canCompleteDraw()) {
        console.log(chalk.dim(`Completing draw ${drawId}....`))
        const completeTx = await drawBeacon.completeDraw()
        await completeTx.wait(1)
    }

    console.log(chalk.green(`Done!`))
}

run()
