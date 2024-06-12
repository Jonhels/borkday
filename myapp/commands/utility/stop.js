const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");
const queue = require("./play").queue;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the current song and clear the queue"),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const connection = getVoiceConnection(guildId);

    if (!connection) {
      return interaction.reply(
        "Barkbark 🐶 I am not connected to any voice channel",
      );
    }

    // Clear the queue for this guild
    if (queue.has(guildId)) {
      queue.set(guildId, []); // Clear the queue
    }

    connection.destroy();

    await interaction.reply(
      "Barkbark 🐶 Stopped barking and cleared the queue 🐶",
    );
  },
};
