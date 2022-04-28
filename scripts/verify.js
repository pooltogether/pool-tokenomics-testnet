const chalk = require('chalk')
const execSync = require('child_process').execSync;
const hardhat = require("hardhat");

async function forgeVerify(deploymentName) {
    console.log(chalk.dim(`Verifying ${deploymentName}...`))
    const chainId = await hardhat.getChainId()
    const deployment = await hardhat.deployments.get(deploymentName)
    const constructorObj = deployment.abi.find(obj => obj.type == 'constructor')
    let constructorArgs = ''
    if (constructorObj) {
        const constructorTypes = constructorObj.inputs.map(input => input.type).join(',')
        const constructor = `constructor(${constructorTypes})`
        const args = deployment.args.join(' ')
        constructorArgs = `--constructor-args \`cast abi-encode "${constructor}" ${args}\``
    }

    try {
        execSync(`cd submodules/pool-tokenomics-prototype && git submodule init && git submodule update && \
        forge verify-contract \
            --chain-id ${chainId} \
            --compiler-version v0.8.6+commit.11564f7e \
            --num-of-optimizations 200 \
            ${constructorArgs} \
            ${deployment.address} \
            src/${deploymentName}.sol:${deploymentName} \
            ${process.env.POLYGONSCAN_API_KEY}
        `)
    } catch (e) {
        console.error(e)
    }
    console.log(chalk.green(`Verified ${deploymentName}!`))
}

async function verify() {
    await forgeVerify('DrawCalculator')
    await forgeVerify('PrizePoolLiquidator')
    await forgeVerify('GaugeController')
    await forgeVerify('PrizeDistributor')
}

verify()