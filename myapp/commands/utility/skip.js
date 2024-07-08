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
      await interaction.reply("Please wait before skipping again.");
      logger.info("Skip command cooldown triggered.");
      return;
    }
    lastSkipTime = now;
    await interaction.deferReply();
    logger.info("Processing skip command.");

    const guildId = interaction.guild.id;
    const connection = getVoiceConnection(guildId);

    if (!connection) {
      await interaction.followUp(
        "Barkbark 🐶 I am not connected to any voice channel.",
      );
      logger.error("No voice connection found.");
      return;
    }

    const userVoiceChannel = interaction.member.voice.channel;
    if (
      !userVoiceChannel ||
      userVoiceChannel.id !== connection.joinConfig.channelId
    ) {
      await interaction.followUp(
        "Barkbark 🐶 You need to be in the same voice channel to skip songs.",
      );
      logger.error("User not in the correct voice channel.");
      return;
    }

    const player = players.get(guildId);
    if (!player) {
      await interaction.followUp("Barkbark 🐶 No player found.");
      logger.error("Player not found for guild.");
      return;
    }

    const currentQueue = queue.get(guildId);
    if (!currentQueue || currentQueue.length === 0) {
      await interaction.followUp("Barkbark 🐶 There are no songs to skip.");
      logger.error("No songs in queue to skip.");
      return;
    }

    player.stop();
    currentQueue.shift();
    logger.info("Song skipped.");

    if (currentQueue.length > 0) {
      const nextSongUrl = currentQueue[0];
      playSong(guildId, interaction, nextSongUrl);
      await interaction.followUp(
        `Skipped! 🎵 ${currentQueue.length} song(s) left in the queue.`,
      );
      logger.info("Next song started.");
    } else {
      await interaction.followUp(
        "Barkbark 🐶 No more songs in the queue. The queue is now empty.",
      );
      logger.info("Queue is now empty.");
    }
  },
};
