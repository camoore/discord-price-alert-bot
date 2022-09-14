const redis = require("redis");
const client = redis.createClient({ url: process.env.REDIS_URL || "" });

client.on("connect", function () {
  console.log("Redis Connected...");
});

client.on("error", function (err) {
  console.log(err);
});

const redisConnect = async () => {
  await client.connect();
};

module.exports = {
  redisConnect,
  getLastRun: async (contract) => {
    let result = await client.get(contract);
    console.log("Last Run: ", new Date(parseInt(result)));
    return result;
  },
  setLastRun: async (contract, value) => {
    await client.set(contract, value);
  },
};
