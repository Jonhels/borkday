# borkday
voffvoffvoff
Borkday is a simple dockerized discord.js bot that can be used to play youtube songs in your discord server. It is based on the discord.js library and uses the ytdl-core library to play youtube songs.

To start the server you need to have a discord bot token. You can get one by creating a new bot at the discord developer portal. Add the token to the .env file and run the bot with docker-compose --build. The bot will then be online and you can invite it to your server.

## Dockerhub

## Commands
/play
/stop
/skip
/bark
/user
/server

## Hosting and running the bot
You can either host the bot yourself with the docker image that is provided, or just use the one live. Command to run the bot with docker-compose: docker-compose up --build. You can also build it with docker build -t borkday . and run it with docker run borkday.

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

## Testbuild/development build
I now have a development build that is where i will work on future improvement and test them when i got time. For this i have a branch and enviroment called development.
The development bot of barkbot will be here. The production build is still the correct bot to use if you just want to use the application to play music in your discord server.


https://discord.com/oauth2/authorize?client_id=561955129541001216&permissions=580552880080960&integration_type=0&scope=bot
.. new ip
