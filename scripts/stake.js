const chalk = require('chalk');
const hardhat = require('hardhat');
const { ethers } = hardhat;

async function run() {
  const gaugeController = await ethers.getContract('GaugeController');

  const ticket = await ethers.getContract('Ticket-1');
  const pool = await ethers.getContract('Pool');
  console.log(chalk.dim(`Approving gauge controller stake...`));
  await pool.approve(gaugeController.address, ethers.utils.parseEther('1000'));

  const signers = await ethers.getSigners();

  const amount = ethers.utils.parseEther('100');
  console.log(chalk.dim(`Depositing ${ethers.utils.formatEther(amount)}...`));
  await gaugeController.deposit(signers[0].address, amount);
  console.log(chalk.dim(`Increasing gauge...`));
  await gaugeController.increaseGauge(ticket.address, amount);
  console.log(chalk.green(`Done!`));
}

run();
