require("dotenv").config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const MONGOOSE_URI = process.env.MONGOOSE_URI;
const { discordBotLogin } = require("./discord-bot/discord");
const { cronJob } = require("./cron");
const { redisConnect } = require("./redis");
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3333;

const main = async () => {
  await discordBotLogin(DISCORD_TOKEN);
  console.log("Discord Bot Logged In...");
  await mongoose.connect(MONGOOSE_URI);
  console.log("Connected to Mongo...");
  await redisConnect();
  cronJob();
  console.log('Cron Started...')
};

app.use(cors());

app.get("/", async (req, res) => {
  try {
    return res.status(200).json({ sup: "sup" });
  } catch (err) {
    return res.status(200).json({ error: err.message || err.toString() });
  }
});

app.listen(PORT, () => {
  try {
    console.log("Listening on " + PORT);
    main();
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
});
