const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");

// Queue to store the songs
const queue = new Map();

module.exports = {
  queue,
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
      // Only try to play if it's the first song added
      playSong(guildId, interaction, songQueue[0]);
    } else {
      await interaction.followUp(
        `Song added to queue: ${url}, queue length: ${songQueue.length}. Barkbark 🐶`,
      );
    }
  },
};

const players = new Map();

async function playSong(guildId, interaction, url) {
  let connection = getVoiceConnection(guildId);
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
  }

  let player = players.get(guildId);
  if (!player) {
    player = createAudioPlayer();
    connection.subscribe(player);
    players.set(guildId, player);

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("Audio is playing");
      interaction.followUp(`Now playing: ${url}`);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log("The bot has finished playing the audio");
      const songQueue = queue.get(guildId) || [];
      songQueue.shift(); // Remove the played song from the queue
      queue.set(guildId, songQueue); // Update the queue in the map
      if (songQueue.length > 0) {
        playSong(guildId, interaction, songQueue[0]); // Play the next song
      } else {
        connection.destroy();
        interaction.followUp("Playback has finished.");
        players.delete(guildId); // Clean up the player map
      }
    });

    player.on("error", (error) => {
      console.error(`Error in audio player: ${error.message}`);
      interaction.followUp("An error occurred during playback.");
      connection.destroy();
      players.delete(guildId); // Clean up the player map
    });
  }

  const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
  const resource = createAudioResource(stream);
  player.play(resource);
}
