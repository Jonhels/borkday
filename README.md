# borkday
voffvoffvoff
Borkday is a simple dockerized discord.js bot that can be used to play youtube songs in your discord server. It is based on the discord.js library and uses the ytdl-core library to play youtube songs.

To start the server you need to have a discord bot token. You can get one by creating a new bot at the discord developer portal. Add the token to the .env file and run the bot with docker-compose --build. The bot will then be online and you can invite it to your server.

## Commands
/play
/stop
/skip
/bark
/user
/server

## Hosting and running the bot
You can either host the bot yourself or use the docker image that is provided. Command to run the bot with docker-compose: docker-compose up --build. You can also build it with docker build -t borkday . and run it with docker run borkday.

## Configuration
To configure the bot you need to add the following environment variables:

// This is the token for the discord bot. You can get one by creating a new bot at the discord developer portal.
DISCORD_TOKEN =

// This is the client id of the bot. You can get it from the discord developer portal.
CLIENT_ID =

## Installation
npm install should install all dependencies when in app directory.

## Usage
This bot is free to use and modify. I only made this bot to have it in my own discord servers, but since i have it public on github you can use it as well. This bot is ment to be a template for any discord bot that you want to create. You can use the code as you like, but please give me credit if you use it in your own project. From Jonhels
