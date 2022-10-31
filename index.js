require('dotenv').config()
// Dependancies
const axios = require("axios");
const fs = require("fs");
const discord = require("discord.js");
const teams = require("@nhl-api/teams");
const internal = require('stream');
const e = require('express');
const checkScore = require("./src/checkScore.js").checkScore;
const getStandings = require("./src/getStandings.js").getStandings;
// Variables
const client = new discord.Client();
const token = process.env.TOKEN;
const api = "https://statsapi.web.nhl.com/";
var started = false;
var raw = fs.readFileSync('imgs.json')
var content = JSON.parse(raw);
var gameid;
var gmes = [];
var bgame = false;
var length = 0;
var bruinsgame = false;
var currbruinsgame = false;
var id;
var otherteam = "";
var otherteamid;
var otherteamrecord;
var brecord;
var bhome = 0;
var baway = 0;

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
 * @param {string} footer - the footer of the message to check for.           
 * @returns {promise<boolean>} - resolves with a boolean true if the message has already been sent, false otherwise.           
 */
async function alreadySent(channel, title,description){
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
 * @returns {promise<boolean>} - whether or not the message has already been sent.           
 */
async function alreadySentwithFooter(channel, title, description, footer) { 
  var sent = false;
  await channel.messages.fetch({ limit: 30 }).then(messages => {
    messages.forEach(async (msg) => {
      if (typeof msg.embeds[0] != "undefined" && msg.embeds[0].footer != null &&msg.embeds[0].title == title && msg.embeds[0].description == description && msg.embeds[0].footer.text == footer) {
        sent = true;
      }
    });
  });
  return sent;
}

StartApp();

/**
 * Sets the bot's activity to the number of NHL games today.           
 * @returns None           
 */
client.on("ready", () => {
  client.user.setActivity(`There are ${length} NHL games today.`);
  console.log(
    `Ready to serve on ${client.guilds.cache.size} servers, for ${client.users.cache.size} users.`
  );
});

/**
 * Handles the NHL games and sends them to the channel.
 * Recursively checks for new games every 10 minutes.           
 * @returns None           
 */
async function handleGames() {
  gmes = []
  axios.get(api + "api/v1/schedule").then(async (resp) => {
    setTimeout(handleGames, 600000);
    resp.data.dates.forEach(async (obj) => {
      Object.entries(obj).forEach(async ([key, value]) => {
        if (key == "games") {
          value.forEach(async (obj2) => {
            var home = "";
            var away = "";
            var homeID = "";
            var homeLink = "";
            var awayLink = "";
            var gameID = obj2.gamePk;
            var awayID;
            var dte;
            var aleaguerecord;
            var hleaguerecord;
            Object.entries(obj2).forEach(async ([key2, value2]) => {
              if (key2 == "gameDate") {
                dte = new Date(value2);
              }
              if (key2 == "teams") {
                away = value2.away.team.name;
                awayLink = value2.away.team.link;
                awayID = value2.away.team.id;
                home = value2.home.team.name;
                homeID = value2.home.team.id;
                homeLink = value2.home.team.link;
                aleaguerecord = value2.away.leagueRecord.wins + "-" + value2.away.leagueRecord.losses + "-" + value2.away.leagueRecord.ot;
                hleaguerecord = value2.home.leagueRecord.wins + "-" + value2.home.leagueRecord.losses + "-" + value2.home.leagueRecord.ot;
              }
            });
            if (home != "" && away != "") {
              gmes.push({
                homeTeam: home,
                homeLink: homeLink,
                homeRecord: hleaguerecord,
                homeID: homeID,
                awayTeam: away,
                awayRecord: aleaguerecord,
                awayLink: awayLink,
                awayID: awayID,
                dateClass: dte,
                gameID: gameID
              });
            }
          });
          length = gmes.length;
          if (!started) {
            client.once("ready", async () => {
              for (var i = 0; i < gmes.length; i++) {
                if (gmes[i].awayID == 6 || gmes[i].homeID == 6) {
                  bruinsgame = true;
                }
                var thumb = getImgUrl(gmes[i].homeTeam.replace(/\s/g, ''))
                var hmemoji = await client.emojis.cache.find(emoji => emoji.name === gmes[i].homeTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
                //console.log(gmes[i].homeID)
                var awemoji = await client.emojis.cache.find(emoji => emoji.name === gmes[i].awayTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
                var tm = (gmes[i].homeID == 54) ? "#B4975A" :"#99d9d9";
                tm = (gmes[i].homeID == 53) ? "#8C2633":tm;
                if (gmes[i].homeID != 55 && gmes[i].homeID != 54 && gmes[i].homeID != 53) {
                  tm = teams.default[(gmes[i].homeID - 1)].colors[0];
                }
                const embed = new discord.MessageEmbed()
                  .setTitle(`${gmes[i].awayTeam} @ ${gmes[i].homeTeam}`)
                  .setThumbnail(thumb)
                  .setDescription(
                    `<t:${Math.floor(gmes[i].dateClass.getTime() / 1000)}>`
                  )
                  .setColor(tm)
                  .addField("Home Team", `${hmemoji}${gmes[i].homeTeam} (${gmes[i].homeRecord})`, true)
                  .addField("Away Team", `${awemoji}${gmes[i].awayTeam} (${gmes[i].awayRecord})`, true)
                  .setFooter("Game ID: " + gmes[i].gameID);
                  ;
                if (gmes[i].homeID == 6 || gmes[i].awayID == 6) {
                  const dm = await client.users.cache.get(process.env.MY_ID).createDM();
                  if (!await alreadySent(dm, embed.title, embed.description)) { 
                    dm.send(embed);
                  }
                }
                if (!await alreadySent(client.channels.cache.get("1035253775000162374"), embed.title, embed.description)) {
                  client.channels.cache.get("1035253775000162374").send(embed).then(sentEmbed => {
                    var home1 = sentEmbed.embeds[0].title.split("@")[1];
                    var home = home1.replace("Montréal Canadiens", "Montreal Canadiens").replace(".", "");
                    var away1 = sentEmbed.embeds[0].title.split("@")[0];
                    var away = away1.replace("Montréal Canadiens", "Montreal Canadiens").replace(".", "")
                    var hm = client.emojis.cache.find(emoji => emoji.name == home.replace(/\s/g, ''))
                    var aw = client.emojis.cache.find(emoji => emoji.name == away.replace(/\s/g, ''))
                    sentEmbed.react(hm.id);
                    sentEmbed.react(aw.id);
                  });
                  
                }
                
              }
              var i2 = bruinsgame ? " 1 of which is a bruins game." : "";
              client.user.setActivity(`There are ${length} NHL games today.${i2}`);
              started = true;
              setTimeout(getStandings,5000);
              setTimeout(brunsG,5000);
            });
          } else { 
            for (var i = 0; i < gmes.length; i++) {
              if (gmes[i].awayID == 6 || gmes[i].homeID == 6) {
                bruinsgame = true;
              }
              var thumb = getImgUrl(gmes[i].homeTeam.replace(/\s/g, ''))
              var hmemoji = await client.emojis.cache.find(emoji => emoji.name === gmes[i].homeTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
              //console.log(gmes[i].homeID)
              var awemoji = await client.emojis.cache.find(emoji => emoji.name === gmes[i].awayTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
              var tm = (gmes[i].homeID == 54) ? "#B4975A" :"#99d9d9";
              tm = (gmes[i].homeID == 53) ? "#8C2633":tm;
              if (gmes[i].homeID != 55 && gmes[i].homeID != 54 && gmes[i].homeID != 53) {
                tm = teams.default[(gmes[i].homeID - 1)].colors[0];
              }
              const embed = new discord.MessageEmbed()
                .setTitle(`${gmes[i].awayTeam} @ ${gmes[i].homeTeam}`)
                .setThumbnail(thumb)
                .setDescription(
                  `<t:${Math.floor(gmes[i].dateClass.getTime() / 1000)}>`
                )
                .setColor(tm)
                .addField("Home Team", `${hmemoji}${gmes[i].homeTeam} (${gmes[i].homeRecord})`, true)
                .addField("Away Team", `${awemoji}${gmes[i].awayTeam} (${gmes[i].awayRecord})`, true);
              if (!await alreadySent(client.channels.cache.get("1035253775000162374"), embed.title, embed.description)) {
                client.channels.cache.get("1035253775000162374").send(embed).then(sentEmbed => {
                  var home1 = sentEmbed.embeds[0].title.split("@")[1];
                  var home = home1.replace("Montréal Canadiens", "Montreal Canadiens").replace(".", "");
                  var away1 = sentEmbed.embeds[0].title.split("@")[0];
                  var away = away1.replace("Montréal Canadiens", "Montreal Canadiens").replace(".", "")
                  var hm = client.emojis.cache.find(emoji => emoji.name == home.replace(/\s/g, ''))
                  var aw = client.emojis.cache.find(emoji => emoji.name == away.replace(/\s/g, ''))
                  sentEmbed.react(aw.id);
                  sentEmbed.react(hm.id);
                });
              }
            }
            var i2 = bruinsgame ? " 1 of which is a bruins game." : "";
            client.user.setActivity(`There are ${length} NHL games today.${i2}`);
          }
        }
      });
    });
  });
}

handleGames();

setTimeout(async ()=>{
  var e = await checkScore("2022020144")
  console.log(e);
})

setTimeout(() =>{
  process.exit(0);
},3600000)