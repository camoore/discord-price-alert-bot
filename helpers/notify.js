require("dotenv").config();
const axios = require("axios");
const { getContractABI, getMetadata } = require("../etherscan/etherscan");
const { formatListingData } = require("./opensea");

const getListings = async (lastRun, contractAddress) => {
  let params = {
    asset_contract_address: `${contractAddress}`,
    limit: "50",
    event_type: "created"
  };

  const { data } = await axios({
    method: "GET",
    url: "https://api.opensea.io/api/v1/events",
    params,
    headers: {
      "x-api-key": process.env.OPENSEA_API_KEY
    }
  });
  console.log('Results Received')
  console.log(`${data.asset_events.length} listings found`)
  let results = await formatListingData(data);
  console.log('Results Formatted')
  if (lastRun) {
    results = results.filter(item => {
      return new Date(item.time) > new Date(parseInt(lastRun));
    });
    console.log('Results Filtered.')
  }
    

  // if (results.length > 0) {
  //   const contractABI = await getContractABI(contractAddress);
  //   for (let listing of results) {
  //     let metadata = await getMetadata(
  //       contractAddress,
  //       listing.id,
  //       contractABI
  //     );
  //     listing.metadata = metadata.attributes;
  //     listing.image = metadata.image;
  //     listing.image_url = metadata.image_url;
  //     listing.animation_url = metadata.animation_url;
  //   }
  // }
  return results;
};

const getFilteredResults = async (results, trait = false, price = false) => {
  if (!results.length) return results;
  // if (trait) {
  //   results = results.filter(result => {
  //     let foundTrait = result.metadata.find(meta => {
  //       if (meta.trait_type.toLowerCase() == trait.trait_type.toLowerCase())
  //         return meta;
  //     });
  //     if (foundTrait) {
  //       if (foundTrait.value.toLowerCase() == trait.value.toLowerCase())
  //         return result;
  //     }
  //   });
  // }

  if (price) {
    results = results.filter(result => {
      return result.token_amount < price;
    });
  }
  return results;
};

module.exports = {
  getListings: (lastRun, contractAddress) => {
    return getListings(lastRun, contractAddress);
  },
  getFilteredResults: (results, trait = false, price = false) => {
    return getFilteredResults(results, trait, price);
  }
};
