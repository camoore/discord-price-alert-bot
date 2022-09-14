const {
  createNotificationDB,
  getNotifications,
  deleteNotification,
  canCreate,
} = require("../mongo/index");
const { MessageEmbed } = require("discord.js");
const { findCollectionName } = require("../helpers/opensea");
const { getLastRun, setLastRun } = require("../redis");

const { Client, Intents } = require("discord.js");
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
client.login(process.env.DISCORD_TOKEN)
client.once("ready", () => {
  console.log('Logged in twice')
})
const createNotification = async (message) => {
  const { content, channelId, guildId } = message;
  const { id, username, discriminator } = message.author;
  const params = content.split(" ");
  if (params.length !== 3) {
    message.channel.send(
      `:warning: Invalid Command :warning: \n\n**contractAddress** AND **price** required\n\nex: \`!ndcreate 0x12345 0.5\``
    );
    return;
  }
  const contract = params[1].toLowerCase();
  const price = params[2];
  const eligible = await canCreate(id, contract);

  if (eligible == 1) {
    const embed = new MessageEmbed({
      title: `You cannot create more than 10 notifications`,
      color: 16711680,
      description: `Please Delete a notification`,
      timestamp: new Date(),
      fields: [
        {
          name: "To remove a notification:",
          value: `Type !ndlist to get all notifications then !ndremove to delete one.`,
        },
      ],
    });
    message.channel.send({ embeds: [embed] });

    return;
  } else if (eligible == 2) {
    const embed = new MessageEmbed({
      title: `You cannot create multiple notifications for the same collection`,
      color: 16711680,
      description: `Please delete the notification for ${contract}`,
      timestamp: new Date(),
      fields: [
        {
          name: "To remove a notification:",
          value: `Type !ndlist to get all notifications then !ndremove to delete it.`,
        },
      ],
    });
    message.channel.send({ embeds: [embed] });
    return;
  }

  const { data } = await findCollectionName(params[1]);
  if (!data) {
    const embed = new MessageEmbed({
      title: `Could not find collection`,
      color: 16711680,
      description: `Invalid Contract Address`,
      timestamp: new Date(),
      fields: [
        {
          name: "Address: ",
          value: contract,
        },
        {
          name: "User: ",
          value: `${username}#${discriminator}`,
        },
      ],
    });
    message.channel.send({ embeds: [embed] });
    // if (message.deletable) {
    //   message.delete();
    // }
    return;
  } else {
    const mongoNotification = createNotificationDB({
      contract,
      collectionName: data[0].name,
      discordGuildID: guildId,
      discordChannelID: channelId,
      discordUserID: id,
      discordUserName: username,
      discordUserDiscriminator: discriminator,
      price: price,
    });
    if (!mongoNotification)
      throw "Could not create this notification in database.";

    const embed = new MessageEmbed({
      title: "Notification Created",
      color: 4718336,
      description: `${username}#${discriminator} created a new Notification`,
      timestamp: new Date(),
      fields: [
        {
          name: "Collection: ",
          value: data[0].name,
        },
        {
          name: "Contract Address: ",
          value: contract,
        },
        {
          name: "When Item Listed Below: ",
          value: price,
        },
      ],
      image: { url: data[0].imageUrl },
    });
    const lastRun = await getLastRun(contract);

    if (!lastRun) {
      console.log("new contract! setting last run!");
      await setLastRun(contract, Date.now());
    } else {
      console.log(
        "This contract is already being monitored! Last Run: ",
        new Date(parseInt(lastRun))
      );
    }
    message.channel.send({ embeds: [embed] });
    // if (message.deletable) {
    //   message.delete();
    // }
  }
};

const listNotifications = async (message) => {
  const { id, username, discriminator } = message.author;
  const foundNotifications = await getNotifications(id);
  if (!foundNotifications.length) {
    message.channel.send(
      `:warning: You have not created any notifications :warning: \nTry creating one: \`!ndcreate 0x12345 0.5\``
    );
    return;
  }
  let fields = foundNotifications.map((notification, index) => {
    return {
      name: `${index + 1}. When ${
        notification.collectionName
      } is listed lower than ${notification.price}`,
      value: `id: ${notification._id.toString()}`,
    };
  });

  const embed = new MessageEmbed({
    title: `${username}#${discriminator}'s Notifications`,
    color: 4718336,
    description: `List of all your active Notifications`,
    timestamp: new Date(),
    fields,
  });

  message.channel.send({ embeds: [embed] });
  //   if (message.deletable) {
  //     message.delete();
  //   }
};

const deleteNotificationCommand = async (message) => {
  const { content } = message;
  const { id, username, discriminator } = message.author;
  const params = content.split(" ");
  if (params.length !== 2) {
    message.channel.send(
      `:warning: Invalid Command :warning: \n\n**notificationID** required\n\nex: \`!ndremove 34546789\``
    );
    return;
  }
  const mongoID = params[1];
  const notificationToDelete = await deleteNotification(mongoID, id);
  if (notificationToDelete) {
    const embed = new MessageEmbed({
      title: `Notification Removed`,
      color: 16711680,
      description: `${username}#${discriminator} will no longer get the following notification.`,
      timestamp: new Date(),
      fields: [
        {
          name: "Collection: ",
          value: `${notificationToDelete[0].collectionName}`,
        },
        {
          name: "When Listed below: ",
          value: `${notificationToDelete[0].price}`,
        },
      ],
    });
    message.channel.send({ embeds: [embed] });
  } else {
    message.channel.send(
      `:warning: Could the specified notification :warning: \n\nTry Running: \`!ndlist\``
    );
    return;
  }
};

/* 
 *  !ndSetup <info-channel> <command-channel> <notifications-channel>

 */
const setupChannel = async (message, client) => {
  const { content } = message;
  const { id } = message.author;
  if (id !== "") return; //creator id
  else {
    const params = content.split(" ");
    if (params.length !== 4) {
      message.channel.send(
        `:warning: Invalid Command :warning: \n\n**info-channel** **command-channel** AND **notifications-channel** required\n\nex: \`!ndsetup #[info-channel] #[command-channel] #[notifications-channel] \``
      );
      return;
    }
    const infoChannel = params[1];
    const commandChannel = params[2];
    const notificationsChannel = params[3];

    const channel = client.channels.cache.get(
      infoChannel.replace(/[^0-9]/g, "")
    );

    channel.send({
      content: `This is a notification bot that will alert you when a NFT is listed *below* a specified price. \n\nThis is **pre-alpha** so try to break it and let <@863163118056898570> know when you do! Suggestions also appreciated! \n\nNote: The final version of this will not be a discord bot. This is for testing purposes only!\n\nPlease read all of the messages below!!\n\nCreate your commands in ${commandChannel}\n\nNotifications will appear in ${notificationsChannel}\n\nGood luck sniping!`,
      embeds: [
        {
          title: "Creating a Notification",
          description:
            "Notifications are triggered when an asset is listed **below** your set threshold *from the time of your notification being created.*\n\nThere is a 10 notification limit per user (see below how to delete active notifications)",
          color: 5814783,
          fields: [
            {
              name: "Command",
              value: "!ndcreate [contract_address] [price]",
            },
            {
              name: "Example (Metasaurs by Dr. DMT)",
              value: "!ndcreate 0xf7143ba42d40eaeb49b88dac0067e54af042e963 0.1",
            },
            {
              name: "Expectation",
              value:
                "A user will be notified every time a Metasaur by Dr. DMT is listed **below** 0.1 ETH.",
              inline: true,
            },
          ],
        },
        {
          title: "Getting your active notifications",
          description:
            "Get a full list of your active notifications. The **notification_id** is what you will use to delete a notification.",
          color: 5814783,
          fields: [
            {
              name: "Command",
              value: "!ndlist",
            },
            {
              name: "Example",
              value: "!ndlist",
            },
            {
              name: "Expectation",
              value:
                "**1. When Metasaurs by Dr. DMT is listed lower than 0.1**\nnotification_id: __6554b6bae2e9778942a55a35c6__",
            },
          ],
        },
        {
          title: "Deleting a notification",
          description:
            "Delete a notification when it is no longer needed or a user has reached their max notification threshold.",
          color: 5814783,
          fields: [
            {
              name: "Command",
              value: "!ndremove [notification_id]",
            },
            {
              name: "Example",
              value: "!ndremove 6554b6bae2e9778942a55a35c6",
            },
            {
              name: "Expectation",
              value:
                "A user will no longer get notifications when a *Metasaurs by Dr. DMT is listed lower than 0.1*",
            },
          ],
        },
      ],
    });
  }
};

const sendResults = async (results) => {
  if (!results.length) return;
  let embeds = [];
  let messages = [];
  const guild = client.guilds.cache.get(""); //your channel
  const channel = guild.channels.cache.get(""); //your channel
  
  for (const result of results) {
    const {usd, img, floor_url, token_amount, token} = result.mutableResults[0];
    const {
      collectionName,
      price,
      discordUserID,
      discordGuildID,
      discordChannelID,
    } = result.notification;
    
    let embeds =
      {
        title: `${collectionName} was listed below your set price! Buy floor now!`,
        url: `${floor_url}`,
        color: 5832536,
        fields: [
          {
            name: "Price:",
            value: `${token_amount} ${token} (${usd})`,
          }
        ],
        footer: {
          text: "Contact @ for any issues",
        },
        timestamp: new Date(),
        image: {
          url: img,
        },
      };
    
    await channel.send({
      content: `<@${discordUserID}>`,
      embeds: [embeds]
    })
  };
};

module.exports = {
  createNotification: (message) => createNotification(message),
  listNotifications: (message) => listNotifications(message),
  deleteNotificationCommand: (message) => deleteNotificationCommand(message),
  setupChannel: (message, client) => setupChannel(message, client),
  sendResults: (results) => sendResults(results),
};
