import axios from 'axios';
const get = axios.get;
import { MessageEmbed } from 'discord.js';
import { client, getImgUrl, alreadySent, alreadySentwithFooter,api } from "../index.js";
import { checkScore } from './checkScore.js';
var gameid;
var gmes = [];
var bgame = false;
var currbruinsgame = false;
var id;
var otherteam = "";
var otherteamid;
var otherteamrecord;
var brecord;
var bhome = 0;
var baway = 0;

/**
 * Gets the schedule from the API and updates variables accordingly.
 * @returns None 
 */
async function bruinsPlaying() {
    await get(api + "api/v1/schedule").then(async (resp) => {
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
                                    var score = await checkScore(gameid);
                                    var desc = "The Boston Bruins have " + (score[0] > score[1] ? "lost" : "won") + " " + score[0] + "-" + score[1] + " against the " + otherteam + (score[0] > score[1] ? ". D: :( ;-(" : "! :D :D :D");
                                    var thumb = getImgUrl(((score[0] > score[1] ? otherteam : "Boston Bruins")).replace(/\s/g, ''));
                                    var tm = teams[5].colors[0];
                                    if (otherteamid != 55) {
                                        tm = (score[0] > score[1] ? getTeamfromID(otherteamid).colors[0] : teams[5].colors[0]);
                                    } else {
                                        if (score[0] > score[1]) {
                                            tm = "#99d9d9";
                                        }
                                    }
                                    const embed = new MessageEmbed()
                                        .setTitle("Bruins game has ended")
                                        .setDescription(desc)
                                        .setThumbnail(thumb)
                                        .setColor(tm)
                                        .addField("Boston Bruins", `${bhome}`, false)
                                        .addField(otherteam, `${baway}`, false);
                                    if (!await alreadySent(client.channels.cache.get("1035253775000162374"), embed.title, embed.description)) {
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
export async function BruinsGame() {
    await bruinsPlaying();
    if (bgame) {
        if (!currbruinsgame) {
            var thumb = getImgUrl("Boston Bruins".replace(/\s/g, ''));
            const embed = new MessageEmbed()
                .setTitle(`Bruins game has started!`)
                .setDescription(`The Bruins are playing the ${otherteam}!`)
                .addField("Boston Bruins", `(${brecord})`, true)
                .addField(otherteam, `(${otherteamrecord})`, true)
                .setThumbnail(thumb)
                .setColor(0xFFB81C)
                .setTimestamp();
            currbruinsgame = true;
            if (!await alreadySent(client.channels.cache.get("1035253775000162374"), embed.title, embed.description)) {
                client.channels.cache.get("1035253775000162374").send(embed);
            }
        }
        id = gameid;
        var score = await checkScore(id);
        setTimeout(BruinsGame, 2000);
        if (score[1] != baway) {
            baway = score[1];
            var thumb = getImgUrl(otherteam.replace(/\s/g, ''));
            var tm = "#99d9d9";
            if (gmes[i].homeID != 55) {
                tm = getTeamfromID(gmes[i].homeID).colors[0];
            }
            const embed = new MessageEmbed()
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
            if (!await alreadySentwithFooter(client.channels.cache.get("1035253775000162374"), embed.title, embed.description, embed.footer.text)) {
                client.channels.cache.get("1035253775000162374").send(embed);
            }
        }
        if (score[0] != bhome) {
            bhome = score[0];
            var thumb = getImgUrl("Boston Bruins".replace(/\s/g, ''));
            const embed = new MessageEmbed()
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
            if (!await alreadySentwithFooter(client.channels.cache.get("1035253775000162374"), embed.title, embed.description, embed.footer.text)) {
                client.channels.cache.get("1035253775000162374").send(embed);
            }
        }
    } else {
        setTimeout(BruinsGame, 5000);
    }
}