const { SlashCommandBuilder } = require("discord.js");
const logger = require("../../logger");

/**
 * Module for the /user command for getting user info
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Replies with user info."),

  /**
   * Executes the /user command to get user info
   * @param {object} interaction - The interaction object that triggered the /user command.
   */
  async execute(interaction) {
    // Construct the reply message with user info
    await interaction.reply(
      `This command was run by ${interaction.user.tag}, who joined on ${interaction.member.joinedAt}.`,
    );
  },
};
