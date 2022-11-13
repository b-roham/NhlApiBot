import axios from 'axios';
const get = axios.get;
import { EmbedBuilder } from 'discord.js';
import { client, getImgUrl, alreadySent, alreadySentwithFooter,api } from "../index.js";
import { checkScore } from './checkScore.js';
import {getTeamfromID} from './getTeam.js'
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
                                    const embed = new EmbedBuilder()
                                        .setTitle("Bruins game has ended")
                                        .setDescription(desc)
                                        .setThumbnail(thumb)
                                        .setColor(tm)
                                        .addFields(
                                            { name: "Boston Bruins", value: `${bhome}`, inline: false},
                                            { name: otherteam, value: `${baway}`, inline: false}
                                        )
                                    if (!await alreadySent(client.channels.cache.get("1035253775000162374"), embed.data.title, embed.data.description)) {
                                        client.channels.cache.get("1035253775000162374").send({ embeds: [embed] });
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
            const embed = new EmbedBuilder()
                .setTitle(`Bruins game has started!`)
                .setDescription(`The Bruins are playing the ${otherteam}!`)
                .addFields(
                    { name: "Boston Bruins", value: `${brecord}`, inline: true },
                    { name: otherteam, value: `${otherteamrecord}`, inline: true }
                )
                .setThumbnail(thumb)
                .setColor(0xFFB81C)
                .setTimestamp();
            currbruinsgame = true;
            if (!await alreadySent(client.channels.cache.get("1035253775000162374"), embed.data.title, embed.data.description)) {
                client.channels.cache.get("1035253775000162374").send({ embeds: [embed] });
            }
        }
        id = gameid;
        var score = await checkScore(id);
        setTimeout(BruinsGame, 2000);
        if (score[1] != baway) {
            var s = (score[1] > baway) ? `The ${otherteam} have scored.` : `The ${otherteam} have had their goal disallowed. LETS GO REFS`;
            baway = score[1];
            var thumb = getImgUrl(otherteam.replace(/\s/g, ''));
            var tm = "#99d9d9";
            if (otherteamid != 55) {
                tm = getTeamfromID(otherteamid).colors[0];
            }
            const embed = new EmbedBuilder()
                .setTitle(`The ${otherteam} have had a score update`)
                .setDescription(`${s} ${bhome}-${baway}`)
                .setThumbnail(thumb)
                .setColor(tm)
                .addFields([
                    { name: "Boston Bruins", value: `${bhome}`, inline: true },
                    { name: otherteam, value: `${baway}`, inline: true },
                    { name: "Period", value: `${score[3]}`, inline: true },
                    { name: "Time in Period", value: `${score[4]}`, inline: true }
                ])
                .setFooter({ text: `Game ID: ${id} ${bhome}-${baway}` })
                .setTimestamp();
            console.log(embed);
            if (!await alreadySentwithFooter(client.channels.cache.get("1035253775000162374"), embed.data.title, embed.data.description, embed.data.footer.text)) {
                client.channels.cache.get("1035253775000162374").send({ embeds: [embed] });
            }
        }
        if (score[0] != bhome) {
            var s = (score[0] > bhome) ? "The Bruins have scored!" : "The Bruins goal has been repealed BOOO REFS U SUCK";
            bhome = score[0];
            var thumb = getImgUrl("Boston Bruins".replace(/\s/g, ''));
            
            const embed = new EmbedBuilder()
                .setTitle(s)
                .setDescription(`${s} ${bhome}-${baway}`)
                .setThumbnail(thumb)
                .addFields(
                    { name: "Boston Bruins", value: `${bhome}`, inline: false },
                    { name: otherteam, value: `${baway}`, inline: false },
                    { name: "Period", value: `${score[3]}`, inline: true },
                    { name: "Time in Period", value: `${score[4]}`, inline: true }
                )
                .setColor(0xFFB81C)
                .setFooter({ text: "Game ID: " + id + ` ${bhome}-${baway}` })
                .setTimestamp();
            if (!await alreadySentwithFooter(client.channels.cache.get("1035253775000162374"), embed.data.title, embed.data.description, embed.data.footer.text)) {
                client.channels.cache.get("1035253775000162374").send({ embeds: [embed] });
            }
        }
    } else {
        setTimeout(BruinsGame, 5000);
    }
}