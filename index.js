require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const discord = require("discord.js");

const today = new Date();
const client = new discord.Client();
const token = process.env.TOKEN;
const api = "https://statsapi.web.nhl.com/";
var started = false;
let rawdata = fs.readFileSync("gamestoday.json");
let team = JSON.parse(rawdata);

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

StartApp();
var length = 0;
var bruinsgame = false;
client.on("ready", () => {
  client.user.setActivity(`There are ${length} NHL games today.`);
  console.log(
    `Ready to serve on ${client.guilds.cache.size} servers, for ${client.users.cache.size} users.`
  );
});

var gmes = [];

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
        console.log(gmes);
        length = gmes.length;
        client.once("ready", () => {
          for (var i = 0; i < gmes.length; i++) {
            if (gmes[i].awayID == 6 || gmes[i].homeID == 6) {
              bruinsgame = true;
            }
            const embed = new discord.MessageEmbed()
              .setTitle(`${gmes[i].awayTeam} @ ${gmes[i].homeTeam}`)
              .setDescription(
                `<t:${Math.floor(gmes[i].dateClass.getTime() / 1000)}>`
              )
              .setFooter("Bot by NotBroham");
            client.channels.cache.get("1033096707518509076").send(embed);
          }
          var i2 = bruinsgame ? " 1 of which is a bruins game." : "";
          client.user.setActivity(`There are ${length} NHL games today.${i2}`);
          started = true;
        });
        let data = JSON.stringify(gmes, null, 2);
        fs.writeFileSync("gamestoday.json", data);
      }
    });
  });
});

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
                    .setDescription(`<t:${Math.floor(dte.getTime() / 1000)}>`)
                  client.channels.cache.get("1033096707518509076").send(embed);
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

setTimeout(newG, 5000);