const { SlashCommandBuilder } = require("discord.js");
const logger = require("../../logger");
/**
 * Module for the /dog command for getting dog info
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("dog")
    .setDescription("What does the dog do!"),
  /**
   * Executes the /dog command to get dog info
   * @param {object} interaction - The interaction object that triggered the /dog command.
   */
  async execute(interaction) {
    // Construct the reply message with a bark
    await interaction.reply("Bark!");
  },
};
