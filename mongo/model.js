const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const notificationSchema = new Schema({
    contract: String,
    collectionName: String,
    discordGuildID: String,
    discordChannelID: String,
    discordUserID: String,
    discordUserName: String,
    discordUserDiscriminator: String,
    price: String,
    timesExecuted: {
        type: Number,
        default: 0
    },
    createDate: {
        type: Date,
        default: Date.now
    }
})

module.exports = model('Notification', notificationSchema);