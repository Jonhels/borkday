// Node modules and dotenv
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const logger = require("./logger");

// Require discord.js library
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");

// Create a new const for token called token
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

/**
 * Create a new client instance
 */
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Create a new collection for commands
client.commands = new Collection();

/**
 * Reads the 'commands' directory and registers all command modules found.
 */
const folderPath = path.join(__dirname, "commands"); // Get the path of the commands folder
const commandFolders = fs.readdirSync(folderPath); // Read the commands folder

// Loop through each folder in the commands folder
for (const folder of commandFolders) {
  const commandsPath = path.join(folderPath, folder); // Get the path of the folder
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js")); // Read the folder and find js files

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file); // Get the path of the file
    const command = require(filePath); // Require the file

    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      logger.error(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

/**
 * Event listener for the client 'ready' event to log when the client is ready.
 */
client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Client started. Logged in as ${readyClient.user.tag}`);
});

/**
 * Event listener for the client joining a new guild to deploy commands.
 */
client.on(Events.GuildCreate, async (guild) => {
  logger.info(`Joined new guild: ${guild.id}`);

  const commands = [];
  for (const command of client.commands.values()) {
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    logger.info(`Deploying commands to guild: ${guild.id}`);
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guild.id),
      { body: commands },
    );
    logger.info(
      `Successfully deployed ${data.length} commands to guild: ${guild.id}`,
    );
  } catch (error) {
    logger.error(`Failed to deploy commands to guild: ${guild.id}`, error);
  }
});

/**
 * Event listener for command interactions to execute corresponding commands.
 */
client.on(Events.InteractionCreate, async (interaction) => {
  // If the interaction is not a command, return
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`No command matching ${interaction.commandName} was found`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(error);

    // If the interaction was replied to or deferred, follow up with an error message
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// Login to Discord with app token
client.login(token);
