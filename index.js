// Dependancies
const axios = require("axios");
const fs = require("fs");
const discord = require("discord.js");
const teams = require("@nhl-api/teams");
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
  await channel.messages.fetch({ limit: 40 }).then(messages => {
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
              var hmemoji = await client.emojis.cache.find(emoji => emoji.name === gmes[i].homeTeam.replace(/\s/g, '').replace(".","").replace("é","e"));
              console.log(gmes[i].homeID)
              var awemoji = await client.emojis.cache.find(emoji => emoji.name === gmes[i].awayTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
              var tm = "#99d9d9";
              if (gmes[i].homeID != 55){
                tm = teams.default[(gmes[i].homeID-1)].colors[0];
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
}

handleGames();

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
                  if (!await alreadySent(client.channels.cache.get("1035253775000162374"),embed.title,embed.description)){
                    client.channels.cache.get("1035253775000162374").send(embed);
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
        if (!await alreadySent(client.channels.cache.get("1035253775000162374"),embed.title,embed.description)){
          client.channels.cache.get("1035253775000162374").send(embed);
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
          .setDescription(`The ${otherteam} have scored boooo ${bhome}-${baway}`)
          .setThumbnail(thumb)
          .addField("Boston Bruins", `${bhome}`, false)
          .addField(otherteam, `${baway}`, false);
        if (!await alreadySent(client.channels.cache.get("1035253775000162374"),embed.title,embed.description)){
          client.channels.cache.get("1035253775000162374").send(embed);
        }
      }
      if (score[1] > bhome) {
        bhome = score[1];
        var thumb = await getImgUrl("Boston Bruins".replace(/\s/g, ''));
        const embed = new discord.MessageEmbed()
          .setTitle(`The Bruins have scored!!!`)
          .setDescription(`The Bruins have scored!!!  ${bhome}-${baway}`)
          .setThumbnail(thumb)
          .addField("Boston Bruins", `${bhome}`, false)
          .addField(otherteam, `${baway}`, false)
          .setColor(0xFFB81C);
        if (!await alreadySent(client.channels.cache.get("1035253775000162374"),embed.title,embed.description)){
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

getStandings();

setTimeout(brunsG, 5000);