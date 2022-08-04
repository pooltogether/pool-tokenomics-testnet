const fs = require('fs');

const rinkebyDeployments = `${__dirname}/../deployments/rinkeby`;
// const mumbaiDeployments = `${__dirname}/../deployments/mumbai`;
// const avalancheFujiDeployments = `${__dirname}/../deployments/fuji`;

const networkDeploymentPaths = [rinkebyDeployments];

/**
 * Contract Naming Convention
 * At a minimum includes a ContractType
 *
 * Any of the following are valid:
 * {ContractType}
 * {ContractType}-{Deployment}
 * {ContractType}{Version}
 * {ContractType}{Version}-{Deployment}
 *
 * ContractType: string
 * Version: /(V[1-9])+(_[0-9]+){0,2}/g; - optional
 * Deployment: number - optional
 */

const VERSION_REGEX = /(V[1-9])+(_[0-9]+){0,2}/g;

const getVersion = (contractName) => {
  const [major, minor, patch] = contractName.match(VERSION_REGEX)?.[0].slice(1).split('_') || [];

  return {
    major: Number(major) || 2,
    minor: Number(minor) || 0,
    patch: Number(patch) || 0,
  };
};

const getContractType = (contractName) => {
  return contractName.split('-')[0].split(VERSION_REGEX)[0];
};

const contractList = {
  name: 'Testnet Linked Prize Pool',
  version: {
    major: 2,
    minor: 0,
    patch: 0,
  },
  tags: {},
  contracts: [],
};

const formatContract = (chainId, contractName, deploymentBlob) => {
  return {
    chainId,
    address: deploymentBlob.address,
    version: getVersion(contractName),
    type: getContractType(contractName),
    abi: deploymentBlob.abi,
    tags: [],
    extensions: {},
  };
};

networkDeploymentPaths.forEach((networkDeploymentPath) => {
  const contractDeploymentPaths = fs
    .readdirSync(networkDeploymentPath)
    .filter((path) => path.endsWith('.json'));
  const chainId = Number(fs.readFileSync(`${networkDeploymentPath}/.chainId`, 'utf8'));

  contractDeploymentPaths.forEach((contractDeploymentFileName) => {
    const contractName = contractDeploymentFileName.split('.')[0];
    const contractDeployment = JSON.parse(
      fs.readFileSync(`${networkDeploymentPath}/${contractDeploymentFileName}`, 'utf8'),
    );
    contractList.contracts.push(formatContract(chainId, contractName, contractDeployment));
  });
});

fs.writeFile(`${__dirname}/../contracts.json`, JSON.stringify(contractList), (err) => {
  if (err) {
    console.error(err);
    return;
  }
});
