const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const {
  getVoiceConnection,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const { queue, players } = require("./play");
const logger = require("../../logger");

/**
 * Module for stopping the current song/playlist and clearing the queue in a guild.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the current song and clear the queue"),

  /**
   * Executes the stop command, stopping the current song/playlist and clearing the queue.
   * @param {CommandInteraction} interaction - The interaction object created when an user invokes the /stop command.
   */
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const connection = getVoiceConnection(guildId);

    if (!connection) {
      return interaction.reply(
        "Barkbark 🐶 I am not connected to any voice channel.",
      );
    }

    // Check if the command issuer is in the same voice channel as the bot
    const userVoiceChannel = interaction.member.voice.channel;
    if (
      !userVoiceChannel ||
      userVoiceChannel.id !== connection.joinConfig.channelId
    ) {
      await interaction.reply(
        "Barkbark 🐶 You need to be in the same voice channel to stop the music.",
      );
      return;
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
