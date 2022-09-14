const { Client, Intents } = require("discord.js");
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
const { createNotification, listNotifications, deleteNotificationCommand, setupChannel } = require('./commands')

client.once("ready", () => {
    client.user.setActivity("PaperHands", { type: "WATCHING" });
});

client.on("error", error => {
    console.error("Error Handled");
});

client.on("messageCreate", async message => {
    const { content, channelId, guildId } = message;
    const messageContent = content.toLowerCase();
    try {
        if (messageContent.startsWith("!ndcreate")) {
            await createNotification(message);
        }
        if (messageContent.startsWith("!ndlist")) {
            await listNotifications(message)
        }
        if (messageContent.startsWith("!ndremove")) {
            await deleteNotificationCommand(message)
        }
        if (messageContent.startsWith("!ndsetup")) {
            await setupChannel(message , client);
        }
    } catch (error) {
        console.error(error)
        message.channel.send(
            "FIX YOUR BOT ``` " + error.toString() + "```"
        );
    }
});

module.exports = {
    discordBotLogin: (token) => client.login(token),
};
