const { getNotifications } = require("../mongo/index");
const cron = require("node-cron");
const { getListings, getFilteredResults } = require("../helpers/notify");
const { getLastRun, setLastRun } = require("../redis");
const { sendResults } = require("../discord-bot/commands");

const getResults = async () => {
  const notifications = await getNotifications();
  let triggeredNotifications = [];
  const uniqueContracts = [
    ...new Set(notifications.map(notification => notification.contract))
  ];
  for (const uniqueContract of uniqueContracts) {
    console.log(`Getting Listings For ${uniqueContract} `);
    const lastRun = await getLastRun(uniqueContract);
    const results = await getListings(lastRun, uniqueContract);
    const relatedNotifications = notifications.filter(
      notification => notification.contract == uniqueContract
    );

    for (notification of relatedNotifications) {
      let mutableResults = results;
      if (notification.trait || notification.price)
        mutableResults = await getFilteredResults(
          results,
          notification.trait,
          notification.price
        );

      console.log(
        `${mutableResults.length} ${notification.collectionName} listings found below ${notification.price}Ξ for ${notification.discordUserName}#${notification.discordUserDiscriminator} \n`
      );

      if (mutableResults.length) {
        triggeredNotifications.push({
          mutableResults,
          notification
        });
      }
    }
    await setLastRun(uniqueContract, Date.now())
  }

  return triggeredNotifications;
};

const cronJob = () => {
  cron.schedule("*/3 * * * *", async () => {
    const results = await getResults();
    await sendResults(results);
  });
};

module.exports = {
  cronJob
};
