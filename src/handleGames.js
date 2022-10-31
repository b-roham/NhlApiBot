// Dependancies
import axios from "axios";
const get = axios.get;
import { MessageEmbed } from "discord.js";
import { getTeamfromID } from "./getTeam.js";
import { client, getImgUrl, alreadySent, api } from "../index.js";
// Variables
var gmes = [];
var length = 0;
var bruinsgame = false;
/**
 * Handles the NHL games and sends them to the channel.
 * Recursively checks for new games every 10 minutes.           
 * @returns None           
 */
export async function handleGames() {
    gmes = []
    get(api + "api/v1/schedule").then(async (resp) => {
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
                    for (var i = 0; i < gmes.length; i++) {
                        if (gmes[i].awayID == 6 || gmes[i].homeID == 6) {
                            bruinsgame = true;
                        }
                        var thumb = getImgUrl(gmes[i].homeTeam.replace(/\s/g, ''))
                        var hmemoji = await client.emojis.cache.find(emoji => emoji.name === gmes[i].homeTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
                        var awemoji = await client.emojis.cache.find(emoji => emoji.name === gmes[i].awayTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
                        var tm = "#99d9d9";
                        if (gmes[i].homeID != 55) {
                            tm = getTeamfromID(gmes[i].homeID).colors[0];
                        }
                        const embed = new MessageEmbed()
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
            });
        });
    });
}