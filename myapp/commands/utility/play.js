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
const logger = require("../../logger");
const ytpl = require("ytpl");

// Create a map to store the queue and players for each guild
const queue = new Map();
const players = new Map();

module.exports = {
  queue,
  players,
  playSong,
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or playlist from YouTube")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The YouTube URL of the song or playlist")
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

    const isPlaylist = url.includes("list=");

    if (!isPlaylist && !url.includes("youtube.com/watch?v=")) {
      await interaction.followUp(
        "Please provide a valid YouTube URL, barkbark 🐶",
      );
      return;
    }

    if (isPlaylist) {
      await addPlaylistToQueue(interaction, url);
    } else {
      await addSongToQueue(interaction, url);
    }
  },
};

// Add support for YouTube playlist (ytpl)
async function addPlaylistToQueue(interaction, url) {
  const guildId = interaction.guildId;
  const playlistIdMatch = url.match(/(?:list=)([a-zA-Z0-9_-]+)/);
  const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;

  if (!playlistId) {
    await interaction.followUp(
      "Please provide a valid YouTube playlist URL, barkbark 🐶",
    );
    return;
  }

  // check if playlist is a radio or mix playlist, currently not supported
  if (playlistId.startsWith("RD") || playlistId.startsWith("UL")) {
    await interaction.followUp(
      "Radio and mix playlists are currently not supported, barkbark 🐶",
    );
    return;
  }
  try {
    // Fetch the playlist details, limit to 5 songs at a time
    const playlist = await ytpl(playlistId, { limit: 5 });

    const songQueue = queue.get(guildId) || [];
    const videoUrls = playlist.items.map((item) => item.shortUrl);

    for (const videoUrl of videoUrls) {
      songQueue.push(videoUrl);
    }

    queue.set(guildId, songQueue);

    if (songQueue.length === videoUrls.length) {
      playSong(guildId, interaction, songQueue[0]);
    }

    await interaction.followUp(
      `Playlist added to the queue: ${playlist.title}, added the first 5 songs. Barkbark 🐶`,
    );
  } catch (error) {
    logger.error(`Error in adding playlist to queue: ${error.message}`);
    await interaction.followUp(
      "An error occurred while adding the playlist to the queue. Barkbark 🐶",
    );
  }
}

// Add support for adding a single song to the queue
async function addSongToQueue(interaction, url) {
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
}

// playSong function to play the song, fetch additional videos from the playlist, and update the queue
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
        const songQueue = queue.get(guildId); // Ensure you fetch the latest queue state
        if (songQueue.length > 0) {
          const currentUrl = songQueue[0]; // Always get the first song as the current
          logger.info(`Now playing: ${currentUrl}`);
          interaction.followUp(`Now playing: ${currentUrl}`);
        }
      });

      player.on(AudioPlayerStatus.Idle, async () => {
        logger.info("The bot has finished playing the audio");
        const songQueue = queue.get(guildId) || [];
        // Remove the current song from the queue, shift() returns the removed element
        songQueue.shift();
        // Update the queue
        queue.set(guildId, songQueue);

        // Check if more videos need to be added to the queue
        if (songQueue.length < 5) {
          const playlistIdMatch = url.match(/(?:list=)([a-zA-Z0-9_-]+)/);
          const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;
          if (playlistId) {
            // fetch additional videos from the playlist, 5 at a time
            const additionalVideos = await fetchAdditionalVideos(playlistId, 5);
            for (const videoUrl of additionalVideos) {
              songQueue.push(videoUrl);
            }
            queue.set(guildId, songQueue);
            // Inform the user that more songs have been added to the queue
            await interaction.followUp(
              `Fetched and added 5 more songs from the playlist to the queue. Barkbark 🐶`,
            );
          }
        }

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

// Function to fetch additional videos from a playlist, limit to 5 videos
// Stop command will clear the queue and stop the playback
async function fetchAdditionalVideos(playlistId, limit) {
  try {
    const playlist = await ytpl(playlistId, { limit });
    return playlist.items.map((item) => item.shortUrl);
  } catch (error) {
    logger.error(`Error in fetching additional videos: ${error.message}`);
    return [];
  }
}
