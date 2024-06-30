const { SlashCommandBuilder } = require("discord.js");
const logger = require("../../logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Replies with user info."),
  async execute(interaction) {
    await interaction.reply(
      `This command was run by ${interaction.user.tag}, who joined on ${interaction.member.joinedAt}.`,
    );
  },
};
