require("dotenv").config();
const axios = require("axios");
const Web3 = require("web3");
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const IPFS_GATEWAYS = [
  //   "http://ipfs.io/ipfs/",
  "https://ravencoinipfs-gateway.com/ipfs/",
  "https://ipfs.adatools.io/ipfs/",
  "https://ipfs.eth.aragon.network/ipfs/",
  //   "https://gateway.ipfs.io/ipfs/",
  "https://cf-ipfs.com/ipfs/",
  //   "https://hardbin.com/ipfs/",
  //   "https://ipfs.2read.net/ipfs/"
  //   "https://cloudflare-ipfs.com/ipfs/"
];

const getContractABI = async contractAddress => {
  const { data } = await axios({
    method: "GET",
    url: "https://api.etherscan.io/api",
    params: {
      module: "contract",
      action: "getabi",
      address: contractAddress,
      tag: "latest",
      apikey: ETHERSCAN_API_KEY
    }
  });
  return JSON.parse(data.result);
};

const getMetadata = async (contractAddress, tokenID, contractABI) => {
  try {
    const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
    contractAddress = Web3.utils.toChecksumAddress(contractAddress);
    const contract = new web3.eth.Contract(await contractABI, contractAddress);
    let tokenURI = await contract.methods.tokenURI(tokenID).call();
    const isIPFS = tokenURI.includes("ipfs");



    if (isIPFS) {
      if (!tokenURI.includes("http")) {
        const index = Math.floor(Math.random() * IPFS_GATEWAYS.length)
        const randomGateway = IPFS_GATEWAYS[index];
        tokenURI = randomGateway + tokenURI.replace("ipfs://", "");
      }
    }

    const { data } = await axios.get(tokenURI);
    return data;
  } catch (error) {
    console.log(error)
  }

};

module.exports = {
  getContractABI,
  getMetadata
};
