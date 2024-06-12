// Node modules and dotenv
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

// Require node-schedule for scheduling tasks
const schedule = require("node-schedule");

// Require discord.js library
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");

// Create a new const for token called token
const token = process.env.DISCORD_BOT_TOKEN;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Create a new collection for commands
client.commands = new Collection();

// Read the commands folder and filter out all files that are not .js files
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
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

// On client start event, log the client user tag to the console
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Client started. Logged in as ${readyClient.user.tag}`);

  // Create a new rule for scheduling tasks
  const rule = new schedule.RecurrenceRule();
  rule.hour = 23; // time in 24 hour format
  rule.minute = 0;
  rule.tz = "Europe/Oslo"; // Timezone dank

  // schedule a job to run at 23:00 every day
  schedule.scheduleJob(rule, () => {
    const today = new Date();
    const thisYearsBirthday = new Date(today.getFullYear(), 5, 11); // 11th of June every year (0-indexed month)
    let nextBirthday = thisYearsBirthday;
    if (today >= thisYearsBirthday) {
      // If today is after the birthday, set the next birthday to next year
      nextBirthday = new Date(today.getFullYear() + 1, 5, 11);
    }
    const diff = nextBirthday - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const message = `There are ${days} days until Alvin turns 30! Congratulations! 🎉🎉🎉. BarkBark 🐶🐶🐶`;
    const channelId = process.env.BIRTHDAY_CHANNEL_ID;
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send(message);
    } else {
      console.log("Channel not found");
    }
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  console.log(interaction);

  // If the interaction is not a command, return
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

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
