const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the current song"),
  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      return interaction.reply(
        "Barkbark 🐶 I am not connected to any voice channel",
      );
    }

    connection.destroy();

    await interaction.reply("Barkbark 🐶 Stopped barking 🐶");
  },
};
