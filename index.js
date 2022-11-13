import dotenv from 'dotenv';
import { readFileSync, readdirSync } from "fs";
import { Client, Collection, GatewayIntentBits, Events } from "discord.js";
import { getStandings } from './src/getStandings.js';
import { BruinsGame } from './src/handleBruinsGame.js';
import { handleGames } from './src/handleGames.js';
const prefix = "!";
dotenv.config();
/**
 * @type {discord.Client} - The discord.js client.
 */
export const api = "https://statsapi.web.nhl.com/";
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});
client.commands = new Collection();

const token = process.env.TOKEN;
/**
 * @type {string} The URL of the NHL stats API.       
 */
var raw = readFileSync('imgs.json')
var content = JSON.parse(raw);
/**
 * Gets the URL of the image with the given name.       
 * @param {string} name - the name of the image.       
 * @returns {string} the URL of the image.       
 */
export function getImgUrl(name){
  for (var i = 0; i< content.length; i++){ 
    if (content[i].name == name){
      return content[i].url;
    }
  }
  return "";
}
/**
 * Starts the application.
 * @returns None
 */
async function StartApp() {
  await client.login(token);
}
/**
 * Checks if a message with the given title and description has already been sent in the channel.           
 * @param {discord.TextChannel} channel - the channel to check for the message in.           
 * @param {string} title - the title of the message to check for.           
 * @param {string} description - the description of the message to check for.       
 * @returns {promise<boolean>} - resolves with a boolean true if the message has already been sent, false otherwise.           
 */
export async function alreadySent(channel, title,description){
  var sent = false;
  await channel.messages.fetch({ limit: 30 }).then(messages => {
    messages.forEach(async (msg) => {
      await msg;
      if(typeof msg.embeds[0] != "undefined" && msg.embeds[0].data.title == title && msg.embeds[0].data.description == description){
        sent = true;
      }
    });
  });
  return sent;
}

/**
 * Checks if a message with the given title, description, and footer has already been sent in the channel.           
 * @param {discord.TextChannel} channel - the channel to check for the message in.           
 * @param {string} title - the title of the message to check for.           
 * @param {string} description - the description of the message to check for.           
 * @param {string} footer - the footer of the message to check for.           
 * @returns {promise<boolean>} - whether or not the message has already been sent.           
 */
export async function alreadySentwithFooter(channel, title, description, footer) { 
  var sent = false;
  await channel.messages.fetch({ limit: 30 }).then(messages => {
    messages.forEach(async (msg) => {
      await msg;
      if (typeof msg.embeds[0] != "undefined" && msg.embeds[0].footer != null &&msg.embeds[0].data.title == title && msg.embeds[0].data.description == description && msg.embeds[0].footer.text == footer) {
        sent = true;
      }
    });
  });
  return sent;
}
/**
 * The main function that runs when the client is ready.  It handles the games, standings, and Bruins game. 
 */
client.once("ready", async () => {
  handleGames(); 
  setTimeout(getStandings,2000);
  setTimeout(BruinsGame, 2000);
  const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
  const slashCommandFiles = readdirSync('./slashCommands').filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    console.log(file);
    client.commands.set(command.name, command);
  }
  for (const file of slashCommandFiles) {
    const command = await import(`./slashCommands/${file}`);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command ./slashCommands/${file} is missing a required "data" or "execute" property.`);
    }
  }
});

client.on('messageCreate', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
	if (!client.commands.has(command)) return;
	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

client.on(Events.InteractionCreate, interaction => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  if (!client.commands.has(commandName)) return;
  try {
    client.commands.get(commandName).execute(interaction);
  } catch (error) {
    console.error(error);
    interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
})

StartApp();