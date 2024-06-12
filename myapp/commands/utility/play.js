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

module.exports = {
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
    await interaction.deferReply(); // Defer the reply to prevent timeout during the setup process.

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

    const channel = interaction.member.voice.channel;
    let connection = getVoiceConnection(channel.guild.id);

    if (!connection) {
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
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
          console.log("Connection lost, attempting to reconnect failed.");
          connection.destroy();
        }
      });
    }

    try {
      const player = createAudioPlayer();
      const stream = ytdl(url, { filter: "audioonly" });
      const resource = createAudioResource(stream);

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("Audio is playing");
        interaction.followUp(`Now playing: ${url}`);
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log("The bot has finished playing the audio");
        connection.destroy(); // Ensure the connection is properly closed.
      });

      player.on("error", (error) => {
        console.error(`Error in audio player: ${error.message}`);
        interaction.followUp("An error occurred during playback.");
        connection.destroy(); // Ensure the connection is properly closed on error.
      });

      await interaction.editReply(`Starting playback: ${url}`);
    } catch (error) {
      console.error(`Error setting up the player: ${error}`);
      await interaction.followUp("Failed to play the video due to an error.");
    }
  },
};
