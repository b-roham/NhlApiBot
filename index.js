// Dependancies
const dotenv = require('dotenv');
const axios = require("axios");
const fs = require("fs");
const discord = require("discord.js");
dotenv.config();
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
var bhome = 0;
var baway = 0;

async function getImgUrl(name){
  for (var i = 0; i<content.length;i++ ){ 
    if (content[i].name == name){
      return content[i].url;
    }
  }
  return "";
}

async function StartApp() {
  await client.login(token);
}

function isToday(date) {
  const tdy = new Date();
  if (date.toDateString() == tdy.toDateString()) {
    return true;
  }
  return false;
}

async function alreadySent(channel, title,description){
  var sent = false;
  await channel.messages.fetch({ limit: 100 }).then(messages => {
    messages.forEach(async (msg) => {
      await msg;
      if(typeof msg.embeds[0] != "undefined"&& msg.embeds[0].title == title && msg.embeds[0].description == description){
        sent = true;
      }
    });
  });
  return sent;
}

StartApp();

client.on("ready", () => {
  client.user.setActivity(`There are ${length} NHL games today.`);
  console.log(
    `Ready to serve on ${client.guilds.cache.size} servers, for ${client.users.cache.size} users.`
  );
});

async function gameExists(home, away) {
  for (var i = 0; i < gmes.length; i++) {
    if (gmes[i].homeTeam == home && gmes[i].awayTeam == away) {
      return true;
    }
  }
  return false;
}

axios.get(api + "api/v1/schedule").then(async (resp) => {
  resp.data.dates.forEach(async (obj) => {
    Object.entries(obj).forEach(async ([key, value]) => {
      if (key == "games") {
        value.forEach(async (obj2) => {
          var home = "";
          var away = "";
          var homeID = "";
          var homeLink = "";
          var awayLink = "";
          var awayID;
          var dte;
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
            }
          });
          if (home != "" && away != "") {
            gmes.push({
              homeTeam: home,
              homeLink: homeLink,
              homeID: homeID,
              awayTeam: away,
              awayLink: awayLink,
              awayID: awayID,
              dateClass: dte,
            });
          }
        });
        length = gmes.length;
        client.once("ready", async () => {
          for (var i = 0; i < gmes.length; i++) {
            if (gmes[i].awayID == 6 || gmes[i].homeID == 6) {
              bruinsgame = true;
            }
            var thumb = await getImgUrl(gmes[i].homeTeam.replace(/\s/g, ''))
            const embed = new discord.MessageEmbed()
              .setTitle(`${gmes[i].awayTeam} @ ${gmes[i].homeTeam}`)
              .setThumbnail(thumb)
              .setDescription(
                `<t:${Math.floor(gmes[i].dateClass.getTime() / 1000)}>`
              );
            if (!await alreadySent(client.channels.cache.get("1034558936893902939"), embed.title, embed.description)) {
              client.channels.cache.get("1034558936893902939").send(embed).then(sentEmbed => {
                      var home1 = sentEmbed.embeds[0].title.split("@")[1];
                      var home = home1.replace("Montréal Canadiens","Montreal Canadiens").replace(".","");
                      var away1 = sentEmbed.embeds[0].title.split("@")[0];
                      var away = away1.replace("Montréal Canadiens","Montreal Canadiens").replace(".","")
                      var hm = client.emojis.cache.find(emoji => emoji.name == home.replace(/\s/g, ''))
                      var aw = client.emojis.cache.find(emoji => emoji.name == away.replace(/\s/g, ''))
                      sentEmbed.react(aw.id);
                      sentEmbed.react(hm.id);
                });;
            }
          }
          var i2 = bruinsgame ? " 1 of which is a bruins game." : "";
          client.user.setActivity(`There are ${length} NHL games today.${i2}`);
          started = true;
        });
      }
    });
  });
});

async function checkScore(gameID) {
  var homeScore = 0;
  var awayScore = 0;
  await axios.get(api + "api/v1/game/" + gameID + "/feed/live").then(async (resp) => {
    Object.entries(resp.data.liveData.linescore).forEach(async ([key, value]) => {
      if (key == "teams") {
        Object.entries(value).forEach(async ([key2, value2]) => {
          if (key2 == "home") {
            Object.entries(value2).forEach(async ([key3, value3]) => {
              if (key3 == "goals") {
                homeScore = value3;
              }
            });
          }
          if (key2 == "away") {
            Object.entries(value2).forEach(async ([key3, value3]) => {
              if (key3 == "goals") {
                awayScore = value3;
              }
            });
          }
        });
      }
    });
  });
  console.log([awayScore, homeScore])
  return [awayScore, homeScore];
}

async function bruinsPlaying() {
  await axios.get(api + "api/v1/schedule").then(async (resp) => {
    resp.data.dates.forEach(async (obj) => {
      Object.entries(obj).forEach(async ([key, value]) => {
        if (key == "games") {
          value.forEach(async (obj2) => {
            var home = "";
            var away = "";
            var active = false;
            var final = false;
            Object.entries(obj2).forEach(async ([key2, value2]) => {
              if (key2 == "teams") {
                away = value2.away.team.name;
                home = value2.home.team.name;
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
                bgame = true;
                gameid = obj2.gamePk;
              }
            } else if (final) {
              bgame = false;
              if (currbruinsgame) {
                currbruinsgame = false;
                var score = await checkScore(gameid);
                var desc = (score[0] > score[1] ? "lost" : "won") + " " + score[0] + "-" + score[1] + " against the " + otherteam;

                const embed = new discord.MessageEmbed()
                  .setTitle("Bruins game has ended")
                  .setDescription(desc)
                  .addField("Boston Bruins", `${bhome}`, false)
                  .addField(otherteam, `${baway}`, false);
                  if (!await alreadySent(client.channels.cache.get("1034558936893902939"),embed.title,embed.description)){
                    client.channels.cache.get("1034558936893902939").send(embed);
                  }
                baway = 0;
                bhome = 0;
              }
            }
          });
        }
      });
    });
  });
}

async function newG() {
  if (started) {
    axios
      .get(api + "api/v1/schedule")
      .then(async (resp) => {
        setTimeout(newG, 5000);
        resp.data.dates.forEach(async (obj) => {
          Object.entries(obj).forEach(async ([key, value]) => {
            if (key == "games") {
              value.forEach(async (obj2) => {
                var home = "";
                var away = "";
                var homeID = "";
                var homeLink = "";
                var awayLink = "";
                var awayID;
                var dte;
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
                  }
                });
                if (home != "" && away != "" && !gameExists(home, away)) {
                  gmes.push({
                    homeTeam: home,
                    homeLink: homeLink,
                    homeID: homeID,
                    awayTeam: away,
                    awayLink: awayLink,
                    awayID: awayID,
                    dateClass: dte,
                  });
                  const embed = new discord.MessageEmbed()
                    .setTitle(`${away} @ ${home}`)
                    .setDescription(`<t:${Math.floor(dte.getTime() / 1000)}>`);
                  if (!await alreadySent(client.channels.cache.get("1034558936893902939"),embed.title,embed.description)){
                    client.channels.cache.get("1034558936893902939").send(embed).then(sentEmbed => {
                      var home1 = sentEmbed.embeds[0].title.split("@")[1];
                      var home = home1.replace("Montréal Canadiens","Montreal Canadiens")
                      var away1 = sentEmbed.embeds[0].title.split("@")[0];
                      var away = away1.replace("Montréal Canadiens","Montreal Canadiens")
                      var hm = client.emojis.cache.find(emoji => emoji.name == home.replace(/\s/g, ''))
                      var aw = client.emojis.cache.find(emoji => emoji.name == away.replace(/\s/g, ''))
                      sentEmbed.react(aw.id);
                      sentEmbed.react(hm.id);
                    });
                  }
                }
              });
            }
          });
        });
      })
      .catch((e) => {
        console.log(e);
        setTimeout(newG, 5000);
      });
  } else {
    setTimeout(newG, 5000);
  }
}

async function brunsG() {
  if (started){
    await bruinsPlaying();
    if (bgame) {
      if (!currbruinsgame) {
        var thumb = await getImgUrl("Boston Bruins".replace(/\s/g, ''));
        const embed = new discord.MessageEmbed()
                .setTitle(`BRUINS GAME HAS STARTED!`)
                .setDescription(
                  `The Bruins are playing the ${otherteam}!`)
                .setThumbnail(thumb)
                .setColor(0xFFB81C);
        currbruinsgame = true;
        if (!await alreadySent(client.channels.cache.get("1034558936893902939"),embed.title,embed.description)){
          client.channels.cache.get("1034558936893902939").send(embed);
        }
      }
      id = gameid;
      var score = await checkScore(id);
      setTimeout(brunsG, 2000);
      if (score[0] > baway) {
        baway = score[0];
        var thumb = await getImgUrl(otherteam.replace(/\s/g, ''));
        const embed = new discord.MessageEmbed()
          .setTitle(`The ${otherteam} have scored`)
          .setDescription(`The ${otherteam} have scored boooo`)
          .setThumbnail(thumb)
          .addField("Boston Bruins", `${bhome}`, false)
          .addField(otherteam, `${baway}`, false);
        if (!await alreadySent(client.channels.cache.get("1034558936893902939"),embed.title,embed.description)){
          client.channels.cache.get("1034558936893902939").send(embed);
        }
      }
      if (score[1] > bhome) {
        bhome = score[1];
        var thumb = await getImgUrl("Boston Bruins".replace(/\s/g, ''));
        const embed = new discord.MessageEmbed()
          .setTitle(`The Bruins have scored!!!`)
          .setDescription(`The Bruins have scored!!!`)
          .setThumbnail(thumb)
          .addField("Boston Bruins", `${bhome}`, false)
          .addField(otherteam, `${baway}`, false)
          .setColor(0xFFB81C);
        if (!await alreadySent(client.channels.cache.get("1034558936893902939"),embed.title,embed.description)){
          client.channels.cache.get("1034558936893902939").send(embed);
        }
      }
    } else {
      setTimeout(brunsG, 5000);
    }
  }else{
    setTimeout(brunsG, 5000)
  }
}

setTimeout(brunsG, 5000);
setTimeout(newG, 5000);