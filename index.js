require('dotenv').config()
// Dependancies
const axios = require("axios");
const fs = require("fs");
const discord = require("discord.js");
const teams = require("@nhl-api/teams");
const internal = require('stream');
const e = require('express');
const check = require("./src/checkScore.js");
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
var periodState = "";

/**
 * Gets the URL of the image with the given name.       
 * @param {string} name - the name of the image.       
 * @returns {string} the URL of the image.       
 */
function getImgUrl(name){
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
 * @param {Discord.TextChannel} channel - the channel to check for the message in.           
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

async function alreadySentwithFooter(channel, title, description, footer) { 
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
                .addField("Away Team", `${awemoji}${gmes[i].awayTeam} (${gmes[i].awayRecord})`, true)
                ;
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
                });;
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


/**
 * Gets the schedule from the API and returns the games that are currently playing, updates based on if the bruins are playing or not.
 * @returns {Promise<Array<games>>} A promise that resolves to an array of games that are currently playing.
 */
async function bruinsPlaying() {
  await axios.get(api + "api/v1/schedule").then(async (resp) => {
    resp.data.dates.forEach(async (obj) => {
      Object.entries(obj).forEach(async ([key, value]) => {
        if (key == "games") {
          value.forEach(async (obj2) => {
            var home = "";
            var away = "";
            var homeid;
            var awayid;
            var aleaguerecord;
            var hleaguerecord;
            var active = false;
            var final = false;
            Object.entries(obj2).forEach(async ([key2, value2]) => {
              if (key2 == "teams") {
                away = value2.away.team.name;
                awayid = value2.away.team.id;
                home = value2.home.team.name;
                homeid = value2.home.team.id;
                aleaguerecord = value2.away.leagueRecord.wins + "-" + value2.away.leagueRecord.losses + "-" + value2.away.leagueRecord.ot;
                hleaguerecord = value2.home.leagueRecord.wins + "-" + value2.home.leagueRecord.losses + "-" + value2.home.leagueRecord.ot;
              }
              
              if (key2 == "status") {
                if (value2.detailedState == "In Progress") {
                  active = true;
                } else if (value2.detailedState == "Final") {
                  final = true;
                  active = false;
                }
              }
            });
            if (active) {
              if (home == "Boston Bruins" || away == "Boston Bruins") {
                otherteam = home == "Boston Bruins" ? away : home;
                otherteamid = home == "Boston Bruins" ? awayid : homeid;
                otherteamrecord = home == "Boston Bruins" ? aleaguerecord : hleaguerecord;
                brecord = home == "Boston Bruins" ? hleaguerecord : aleaguerecord;
                bgame = true;
                gameid = obj2.gamePk;
              }
            } else if (final) {
              if (home == "Boston Bruins" || away == "Boston Bruins") {
                bgame = false;
                if (currbruinsgame) {
                  currbruinsgame = false;
                  var score = await check.checkScore(gameid);
                  var desc = "The Boston Bruins have "+(score[0] > score[1] ? "lost" : "won") + " " + score[0] + "-" + score[1] + " against the " + otherteam + (score[0] > score[1] ? ". D: :( ;-(" : "! :D :D :D");
                  var thumb = getImgUrl(((score[0] > score[1] ? otherteam : "Boston Bruins")).replace(/\s/g, ''));
                  var tm = teams.default[(6 - 1)].colors[0];
                  if (otherteamid != 55) {
                    tm = (score[0] > score[1] ? teams.default[(otherteamid - 1)].colors[0] : teams.default[(6 - 1)].colors[0]);
                  } else {
                    if (score[0] > score[1]) {
                      tm = "#99d9d9";
                    }
                  }

                  const embed = new discord.MessageEmbed()
                    .setTitle("Bruins game has ended")
                    .setDescription(desc)
                    .setThumbnail(thumb)
                    .setColor(tm)
                    .addField("Boston Bruins", `${bhome}`, false)
                    .addField(otherteam, `${baway}`, false);
                    if (!await alreadySent(client.channels.cache.get("1035253775000162374"),embed.title,embed.description)){
                      client.channels.cache.get("1035253775000162374").send(embed);
                    }
                  baway = 0;
                  bhome = 0;
                }
              }
            }
          });
        }
      });
    });
  });
}

/**
 * Checks if the game has started yet. If it has, it will send a message to the channel.
 * @returns None
 */
async function brunsG() {
  if (started){
    await bruinsPlaying();
    if (bgame) {
      if (!currbruinsgame) {
        var thumb = getImgUrl("Boston Bruins".replace(/\s/g, ''));
        const embed = new discord.MessageEmbed()
          .setTitle(`Bruins game has started!`)
          .setDescription(`The Bruins are playing the ${otherteam}!`)
          .addField("Boston Bruins", `(${brecord})`, true)
          .addField(otherteam, `(${otherteamrecord})`, true)
          .setThumbnail(thumb)
          .setColor(0xFFB81C)
          .setTimestamp();
        currbruinsgame = true;
        if (!await alreadySent(client.channels.cache.get("1035253775000162374"),embed.title,embed.description)){
          client.channels.cache.get("1035253775000162374").send(embed);
        }
      }
      id = gameid;
      var score = await check.checkScore(id);
      //console.log(score);
      setTimeout(brunsG, 2000);
      if (score[1] != baway) {
        baway = score[1];
        var thumb = getImgUrl(otherteam.replace(/\s/g, ''));
        var tm = (otherteamid == 54) ? "#B4975A" :"#99d9d9";
        tm = (otherteamid == 53) ? "#8C2633":tm;
        if (otherteamid != 55 && otherteamid != 54 && otherteamid != 53) {
          tm = teams.default[(otherteamid - 1)].colors[0];
        }
        const embed = new discord.MessageEmbed()
          .setTitle(`The ${otherteam} have scored`)
          .setDescription(`The ${otherteam} have scored boooo ${bhome}-${baway}`)
          .setThumbnail(thumb)
          .setColor(tm)
          .addField("Boston Bruins", `${bhome}`, false)
          .addField(otherteam, `${baway}`, false)
          .addField("Period", `${score[3]}`, true)
          .addField("Time left", `${score[4]}`, true)
          .setFooter("Game ID: " + id + ` ${bhome}-${baway}`)
          .setTimestamp();
          if (!await alreadySentwithFooter(client.channels.cache.get("1035253775000162374"),embed.title,embed.description,embed.footer.text)){
            client.channels.cache.get("1035253775000162374").send(embed);
          }
      }
      if (score[0] != bhome) {
        bhome = score[0];
        var thumb = getImgUrl("Boston Bruins".replace(/\s/g, ''));
        const embed = new discord.MessageEmbed()
          .setTitle(`The Bruins have scored!!!`)
          .setDescription(`The Bruins have scored!!!  ${bhome}-${baway}`)
          .setThumbnail(thumb)
          .addField("Boston Bruins", `${bhome}`, false)
          .addField(otherteam, `${baway}`, false)
          .addField("Period", `${score[3]}`, true)
          .addField("Time left", `${score[4]}`, true)
          .setColor(0xFFB81C)
          .setFooter("Game ID: " + id + ` ${bhome}-${baway}`)
          .setTimestamp();
        if (!await alreadySentwithFooter(client.channels.cache.get("1035253775000162374"),embed.title,embed.description,embed.footer.text)){
          client.channels.cache.get("1035253775000162374").send(embed);
        }
      }
    } else {
      setTimeout(brunsG, 5000);
    }
  }else{
    setTimeout(brunsG, 5000)
  }
}
var standings = []; 
/**
 * Gets the standings from the API and updates the standings channel.
 * Recursively calls itself every 5 minutes after recieving a response from the API.           
 * @returns None           
 */
async function getStandings() {
  if (started) {
    await axios.get(api + "api/v1/standings").then(async (resp) => {
      setTimeout(getStandings, 300000);
      resp.data.records.forEach(async (obj) => {
        var temp;
        var temp2 = [];
        Object.entries(obj).forEach(async ([key, value]) => {
          if (key == "division") {
            temp = value.name;
          }
          if (key == "teamRecords") {
            value.forEach(async (obj2) => {
              var team = "";
              var wins = 0;
              var losses = 0;
              var ot = 0;
              var pts = 0;
              Object.entries(obj2).forEach(async ([key2, value2]) => {
                if (key2 == "team") {
                  team = value2.name;
                }
                if (key2 == "leagueRecord") {
                  Object.entries(value2).forEach(async ([key3, value3]) => {
                    if (key3 == "wins") {
                      wins = value3;
                    }
                    if (key3 == "losses") {
                      losses = value3;
                    }
                    if (key3 == "ot") {
                      ot = value3;
                    }
                  });
                }
                if (key2 == "points") {
                  pts = value2;
                }
              });
              temp2.push({
                name: team,
                wins: wins,
                losses: losses,
                ot: ot,
                pts: pts
              })
            });
          }
        });
        standings.push({
          division: temp,
          teams: temp2
        });
      })
    })
    var tmp = ["","","",""]
    for (var i = 0; i < standings.length; i++) { 
      for (var j = 0; j < standings[i].teams.length; j++) {
        var emoji = await client.emojis.cache.find(emoji => emoji.name === standings[i].teams[j].name.replace(/\s/g, '').replace(".","").replace("é","e"));
        tmp[i] +=(j+1)+"." +`${emoji}${standings[i].teams[j].name}` + " **(" + standings[i].teams[j].wins + "-" + standings[i].teams[j].losses + "-" + standings[i].teams[j].ot + ")** PTS: " + standings[i].teams[j].pts + "\n";
      }
    }
    const embed = new discord.MessageEmbed()
      .setThumbnail("https://cdn.bleacherreport.net/images/team_logos/328x328/nhl.png")
      .setAuthor("NHL Standings", "https://cdn.bleacherreport.net/images/team_logos/328x328/nhl.png")
      .addField(standings[0].division + " Division\u200B\u200B\u200B", tmp[0], false)
      .addField(standings[1].division + " Division\u200B\u200B\u200B", tmp[1], false)
      .addField(standings[2].division + " Division\u200B\u200B\u200B", tmp[2], false)
      .addField(standings[3].division + " Division\u200B\u200B\u200B", tmp[3], false)
      .addField("\u200B","Standings as of " + `<t:${Math.floor(new Date().getTime() / 1000)}>`,false)
      .setFooter("Data provided by NHL.com","https://cdn.bleacherreport.net/images/team_logos/328x328/nhl.png")
    client.channels.cache.get("1035254730357747805").messages.fetch({ limit: 10 }).then(messages => {
      messages.forEach(message => {
        if (message.author.bot) {
          message.edit(embed)
        }
      });
    })
  } else {
    setTimeout(getStandings, 5000);
  }
}

setTimeout(getStandings,5000);
setTimeout(brunsG, 5000);
setTimeout(() =>{
  process.exit(0);
},3600000)