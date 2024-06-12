const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dog")
    .setDescription("What does the dog do!"),
  async execute(interaction) {
    await interaction.reply("Bark!");
  },
};
