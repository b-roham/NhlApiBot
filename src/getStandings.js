import axios from 'axios';
const get = axios.get;
import { MessageEmbed } from 'discord.js';
import { client, api } from '../index.js';

/**
 * Gets the standings from the API and updates the standings channel.
 * Recursively calls itself every 5 minutes after recieving a response from the API.           
 * @returns None           
 */
export async function getStandings() {
    var standings = [];
    await get(api + "api/v1/standings").then(async (resp) => {
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
    var tmp = ["", "", "", ""]
    for (var i = 0; i < standings.length; i++) {
        for (var j = 0; j < standings[i].teams.length; j++) {
            var emoji = await client.emojis.cache.find(emoji => emoji.name === standings[i].teams[j].name.replace(/\s/g, '').replace(".", "").replace("é", "e"));
            tmp[i] += (j + 1) + "." + `${emoji}${standings[i].teams[j].name}` + " **(" + standings[i].teams[j].wins + "-" + standings[i].teams[j].losses + "-" + standings[i].teams[j].ot + ")** PTS: " + standings[i].teams[j].pts + "\n";
        }
    }
    const embed = new MessageEmbed()
        .setThumbnail("https://cdn.bleacherreport.net/images/team_logos/328x328/nhl.png")
        .setAuthor("NHL Standings", "https://cdn.bleacherreport.net/images/team_logos/328x328/nhl.png")
        .addField(standings[0].division + " Division\u200B\u200B\u200B", tmp[0], false)
        .addField(standings[1].division + " Division\u200B\u200B\u200B", tmp[1], false)
        .addField(standings[2].division + " Division\u200B\u200B\u200B", tmp[2], false)
        .addField(standings[3].division + " Division\u200B\u200B\u200B", tmp[3], false)
        .addField("\u200B", "Standings as of " + `<t:${Math.floor(new Date().getTime() / 1000)}>`, false)
        .setFooter("Data provided by NHL.com", "https://cdn.bleacherreport.net/images/team_logos/328x328/nhl.png")
    client.channels.cache.get("1035254730357747805").messages.fetch({ limit: 10 }).then(messages => {
        messages.forEach(message => {
            if (message.author.bot) {
                message.edit(embed)
            }
        });
    })
}