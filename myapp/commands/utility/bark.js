const { SlashCommandBuilder } = require("discord.js");
const logger = require("../../logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dog")
    .setDescription("What does the dog do!"),
  async execute(interaction) {
    await interaction.reply("Bark!");
  },
};
