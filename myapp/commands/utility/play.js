const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const logger = require("./logger");

// create a map to store the queue and players for each guild
const queue = new Map();
const players = new Map();

module.exports = {
  queue,
  players,
  playSong,
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from YouTube")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The YouTube URL of the song")
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const url = interaction.options.getString("url");
    if (!interaction.member.voice.channel) {
      await interaction.followUp(
        "You need to be in a voice channel to play music, barkbark 🐶",
      );
      return;
    }

    if (!ytdl.validateURL(url)) {
      await interaction.followUp(
        "Please provide a valid YouTube URL, barkbark 🐶",
      );
      return;
    }

    const guildId = interaction.guildId;
    const songQueue = queue.get(guildId) || [];
    songQueue.push(url);
    queue.set(guildId, songQueue);

    if (songQueue.length === 1) {
      // If the queue length is 1, it means the bot is not playing any song
      playSong(guildId, interaction, songQueue[0]);
    } else {
      await interaction.followUp(
        `Song added to queue: ${url}, queue length: ${songQueue.length}. Barkbark 🐶`,
      );
    }
  },
};

async function playSong(guildId, interaction, url) {
  let connection = getVoiceConnection(guildId);
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
  }

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
    let player = players.get(guildId);
    if (!player) {
      player = createAudioPlayer();
      connection.subscribe(player);
      players.set(guildId, player);

      player.on(AudioPlayerStatus.Playing, () => {
        logger.info("Audio is playing");
        interaction.followUp(`Now playing: ${url}`);
      });

      player.on(AudioPlayerStatus.Idle, () => {
        logger.info("The bot has finished playing the audio");
        const songQueue = queue.get(guildId) || [];
        // Remove the current song from the queue, shift() returns the removed element
        // use shift here to remove the first element in the queue, which is the current song
        songQueue.shift();
        // Update the queue
        queue.set(guildId, songQueue);
        if (songQueue.length > 0) {
          // Play the next song in the queue
          playSong(guildId, interaction, songQueue[0]);
        } else {
          connection.destroy();
          interaction.followUp("Playback has finished.");
          // Clean up the player map
          players.delete(guildId);
        }
      });

      player.on("error", (error) => {
        logger.error(`Error in audio player: ${error.message}`);
        interaction.followUp("An error occurred during playback.");
        connection.destroy();
        players.delete(guildId);
      });
    }

    const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
    const resource = createAudioResource(stream, { inputType: "webm/opus" });
    player.play(resource);
  } catch (error) {
    logger.error(`Error in playing audio: ${error.message}`);
    interaction.followUp("An error occurred while trying to play the audio.");
  }
}
