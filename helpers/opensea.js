const axios = require("axios");

const formatListingData = data => {
  try {
    let listings = [];
    data.asset_events = data.asset_events.filter(item => {
      if (!item.asset_bundle && item.payment_token.symbol == "ETH" && !item.is_private) {
        return item;
      }
    });
    data.asset_events.forEach(listing => {
      let token_amount =
        listing.starting_price / Math.pow(10, listing.payment_token.decimals);

      listings.push({
        id: listing.asset.token_id,
        name: listing.asset.name,
        token: listing.payment_token.symbol,
        token_amount,
        usd: (token_amount * listing.payment_token.usd_price).toLocaleString(
          "en-US",
          {
            style: "currency",
            currency: "USD"
          }
        ),
        seller: {
          username: listing.seller.user ? listing.seller.user.username : null,
          address: listing.seller.address
        },
        type: listing.auction_type,
        time: new Date(listing.created_date + "Z").toLocaleString(),
        img: listing.asset.image_url,
        asset_url: listing.asset.permalink,
        floor_url: `https://opensea.io/collection/${listing.asset.collection.slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`
      });
    });

    return listings;
  } catch (error) {
    console.error(error);
  }
};

const findCollectionName = async contract => {
  let searchObj = {
    sort: { "stats.seven_day_volume": -1 },
    limit: 10,
    fields: {
      name: 1,
      description: 1,
      imageUrl: 1,
      address: 1,
      stats: 1
    },
    filters: { address: contract },
    offset: 0
  };
  const { data } = await axios({
    method: "POST",
    url: "https://genie-production-api.herokuapp.com/searchCollections",
    data: searchObj
  });

  return data;
};

module.exports = {
  formatListingData,
  findCollectionName
};
