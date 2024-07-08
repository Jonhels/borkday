const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");
const { queue, players, playSong } = require("./play");
const logger = require("../../logger");

// Skip cooldown
let lastSkipTime = 0;
const skipCooldown = 5000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current song"),
  async execute(interaction) {
    const now = Date.now();
    if (now - lastSkipTime < skipCooldown) {
      await interaction.followUp("Please wait before skipping again.");
      return;
    }
    lastSkipTime = now;
    await interaction.deferReply();

    const guildId = interaction.guild.id;
    const connection = getVoiceConnection(guildId);

    if (!connection) {
      await interaction.followUp(
        "Barkbark 🐶 I am not connected to any voice channel.",
      );
      return;
    }

    // Get the voice channel of the member who triggered the command
    const userVoiceChannel = interaction.member.voice.channel;

    if (
      !userVoiceChannel ||
      userVoiceChannel.id !== connection.joinConfig.channelId
    ) {
      await interaction.followUp(
        "Barkbark 🐶 You need to be in the same voice channel to skip songs.",
      );
      return;
    }

    const player = players.get(guildId);
    const currentQueue = queue.get(guildId);

    if (!currentQueue || currentQueue.length === 0) {
      await interaction.followUp("Barkbark 🐶 There are no songs to skip.");
      return;
    }

    // Skip the current song
    player.stop();

    // Remove the current song from the queue
    currentQueue.shift();

    if (currentQueue.length > 0) {
      const nextSongUrl = currentQueue[0];
      playSong(guildId, interaction, nextSongUrl);
      // Inform about the number of songs left after skipping
      await interaction.followUp(
        `Skipped! 🎵 ${currentQueue.length} song(s) left in the queue.`,
      );
    } else {
      await interaction.followUp(
        "Barkbark 🐶 No more songs in the queue. The queue is now empty.",
      );
    }
  },
};
