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
    .setDescription("Play a song from youtube")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The YouTube URL of the song")
        .setRequired(true),
    ),
  async execute(interaction) {
    const url = interaction.options.getString("url");

    if (!interaction.member.voice.channel) {
      return interaction.reply(
        "You need to be in a voice channel to play music, barkbark 🐶",
      );
    }

    if (!ytdl.validateURL(url)) {
      return interaction.reply(
        "Please provide a valid YouTube URL, barkbark 🐶",
      );
    }

    const channel = interaction.member.voice.channel;
    let connection = getVoiceConnection(interaction.guild.id);

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
        connection.destroy();
        interaction.followUp("Playback has finished.");
      });

      player.on("error", (error) => {
        console.error(`Error: ${error.message}`);
        connection.destroy();
        interaction.followUp("An error occurred during playback.");
      });

      await interaction.reply(`Starting playback: ${url}`);
    } catch (error) {
      console.error(`Error setting up the player: ${error}`);
      await interaction.reply("Failed to play the video due to an error.");
    }
  },
};
