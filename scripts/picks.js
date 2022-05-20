const chalk = require('chalk');
const hardhat = require('hardhat');

const { ethers } = hardhat;

async function run() {
  const drawCalculator = await ethers.getContract('DrawCalculator');
  const ticket1 = await ethers.getContract('Ticket-1');
  const drawBuffer = await ethers.getContract('DrawBuffer');
  const newestDraw = await drawBuffer.getNewestDraw();

  const signers = await ethers.getSigners();
  console.log(chalk.dim(`Checking for draw ${newestDraw.drawId} and ticket ${ticket1.address}...`));
  const drawPicks = await drawCalculator.getDrawPicks(ticket1.address, [newestDraw.drawId]);
  const userPicks = await drawCalculator.calculateUserPicks(ticket1.address, signers[0].address, [
    newestDraw.drawId,
  ]);
  console.log(chalk.yellow(`Picks allocated to draw: ${drawPicks}...`, drawPicks));
  console.log(chalk.yellow(`Picks allocated to user: ${userPicks}...`, userPicks));

  //   if (newestDraw.drawId > 1) {
  //     const draw2 = await drawBuffer.getDraw(2)
  //     const prizeTier2 = await drawCalculator.getPrizeTier(newestDraw.drawId)
  //     const startTimestamp = draw2.timestamp.sub(draw2.beaconPeriodSeconds)
  //     const endTimestamp = draw2.timestamp

  //     console.log({
  //         startTimestamp: startTimestamp.toString(),
  //         endTimestamp: endTimestamp.toString()
  //     })
  //     const gc = await ethers.getContract('GaugeController')
  //     const gaugeTwabs = await gc.getGaugeTwabsBetween(ticket.address, startTimestamp, endTimestamp)
  //     console.log(ethers.utils.formatEther(gaugeTwabs.gauge))
  //     console.log(ethers.utils.formatEther(gaugeTwabs.gaugeWeight))
  //     console.log(ethers.utils.formatEther(gaugeTwabs.gaugeWeightTotal))
  //   }
}

run();
