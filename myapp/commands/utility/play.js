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

async function playSong(guildId, interaction, url) {
  let connection = getVoiceConnection(guildId);
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log("Voice connection is ready!");
    });
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (error) {
        console.log("Connection lost, attempting to reconnect failed.", error);
        connection.destroy();
      }
    });
  }

  const player = createAudioPlayer();
  const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
  const resource = createAudioResource(stream);
  connection.subscribe(player);
  player.play(resource);

  // Access songQueue from the queue map
  const songQueue = queue.get(guildId) || [];

  player.on(AudioPlayerStatus.Playing, () => {
    console.log("Audio is playing");
    interaction.followUp(`Now playing: ${url}`);
  });

  player.on(AudioPlayerStatus.Idle, () => {
    console.log("The bot has finished playing the audio");
    songQueue.shift(); // Correctly use songQueue here
    queue.set(guildId, songQueue); // Save the updated queue back
    if (songQueue.length > 0) {
      playSong(guildId, interaction, songQueue[0]); // Play the next song in the queue
    } else {
      connection.destroy();
      interaction.followUp("Playback has finished.");
    }
  });

  player.on("error", (error) => {
    console.error(`Error in audio player: ${error.message}`);
    interaction.followUp("An error occurred during playback.");
    connection.destroy();
  });
}
