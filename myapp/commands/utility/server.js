const { SlashCommandBuilder } = require("discord.js");
const logger = require("../../logger");

/**
 * Module for the /server command for getting server info
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Provides information about the server"),
  /**
   * Executes the /server command to get server info
   * @param {object} interaction - The interaction object that triggered the /server command.
   */
  async execute(interaction) {
    // Construct the reply message with server info
    await interaction.reply(
      `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`,
    );
  },
};
