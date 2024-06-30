const { SlashCommandBuilder } = require("discord.js");
const {
  getVoiceConnection,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const { queue, players } = require("./play");
const logger = require("../../logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the current song and clear the queue"),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const connection = getVoiceConnection(guildId);

    if (!connection) {
      return interaction.reply(
        "Barkbark 🐶 I am not connected to any voice channel.",
      );
    }

    // Stop the player and remove it from the players map
    const player = players.get(guildId);
    if (player) {
      player.stop();
      players.delete(guildId);
    }

    // Clear the queue
    if (queue.has(guildId)) {
      queue.set(guildId, []);
      logger.info(`Queue cleared for guild: ${guildId}`);
    }

    // Destroy the voice connection
    if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
      connection.destroy();
      logger.info(`Voice connection destroyed for guild: ${guildId}`);
    }

    await interaction.reply(
      "Barkbark 🐶 Stopped barking and cleared the queue 🐶",
    );
  },
};
