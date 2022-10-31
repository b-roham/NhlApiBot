import dotenv from 'dotenv';
dotenv.config();
// Dependancies
import { readFileSync } from "fs";
import { Client} from "discord.js";
import { getStandings } from './src/getStandings.js';
import { BruinsGame } from './src/handleBruinsGame.js';
import { handleGames } from './src/handleGames.js';
// Variables
/**
 * @type {discord.Client} - The discord.js client.
 */
export const client = new Client();
const token = process.env.TOKEN;
/**
 * @type {string} The URL of the NHL stats API.       
 */
export const api = "https://statsapi.web.nhl.com/";
var raw = readFileSync('imgs.json')
var content = JSON.parse(raw);
var length = 0;
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
      if(typeof msg.embeds[0] != "undefined" && msg.embeds[0].title == title && msg.embeds[0].description == description){
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
 * @returns {boolean} - whether or not the message has already been sent.           
 */
export async function alreadySentwithFooter(channel, title, description, footer) { 
  var sent = false;
  await channel.messages.fetch({ limit: 30 }).then(messages => {
    messages.forEach(async (msg) => {
      await msg;
      if (typeof msg.embeds[0] != "undefined" && msg.embeds[0].footer != null &&msg.embeds[0].title == title && msg.embeds[0].description == description && msg.embeds[0].footer.text == footer) {
        sent = true;
      }
    });
  });
  return sent;
}
/**
 * Sets the bot's activity to the number of NHL games today.           
 * @returns None           
 */
client.once("ready", () => {
  client.user.setActivity(`There are ${length} NHL games today.`);
  console.log(
    `Ready to serve on ${client.guilds.cache.size} servers, for ${client.users.cache.size} users.`
  );
  handleGames();
  setTimeout(getStandings, 2000);
  setTimeout(BruinsGame, 2000)
});

StartApp();