import { getTeamfromID } from '../src/getTeam.js';
import { getTeamId } from "@nhl-api/teams";
import axios from 'axios';
import { client, getImgUrl, alreadySent, api } from "../index.js";
import { EmbedBuilder } from 'discord.js';

export const name = "getrecord";
export const description = "Get the record of an NHL team";
export async function execute(message, args) { 
    var first = message.content.split(" ")[0];
    var team = message.content.substring(first.length + 1);
    var teamId = getTeamId(team);
    teamId = (typeof teamId[0] != 'undefined') ? teamId[0].id : teamId;
    var wins;
    var losses;
    var ot;
    var team;
    var thumb;
    var tm = "#99d9d9";
    if (teamId != -1) {
        await axios.get("https://statsapi.web.nhl.com/api/v1/teams/" + teamId + "/stats").then(async (response) => {
            wins = response.data.stats[0].splits[0].stat.wins;
            losses = response.data.stats[0].splits[0].stat.losses;
            ot = response.data.stats[0].splits[0].stat.ot;
            team = getTeamfromID(teamId).name.replace(/(\w)(\w*)/g,
                function (g0, g1, g2) { return g1.toUpperCase() + g2.toLowerCase(); });;
            if (teamId != 55) {
                tm = getTeamfromID(teamId).colors[0];
            }
            thumb = getImgUrl(team.replace(/\s/g, '').replace("e", "é"));
        })
        console.log(wins,losses,ot)
        const embed = new EmbedBuilder()
            .setTitle(team)
            .setThumbnail(thumb)
            .setColor(tm)
            .setThumbnail(thumb)
            .addFields(
                { name: "Wins", value: `${wins}`, inline: true },
                { name: "Losses", value: `${losses}`, inline: true },
                { name: "Overtime Losses", value: `${ot}`, inline: true },
                {name: "Games Played", value: `${wins+losses+ot}`, inline: true},
                { name: "Points", value: `${wins*2+ot}`, inline: true }
            )
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    } else {
        message.channel.send("Could not find team " + team);
    }       
}