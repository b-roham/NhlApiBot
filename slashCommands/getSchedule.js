import { SlashCommandBuilder } from "discord.js";
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';
import { client } from "../index.js";

export const data = new SlashCommandBuilder()
    .setName("getschedule")
    .setDescription("Gets todays NHL Schedule.")
    .addStringOption((option) => option.setName("date").setDescription("The date to get the schedule for, defaults to the current day.").setRequired(false));
export async function execute(interaction) { 
    console.log('got command')
    var date = interaction.options.getString("date");
    var month;
    var day;
    var year;
    if (date == null) {
        date = new Date();
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
    } else {
        date = new Date(interaction.options.getString("date"));
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
    }
    date = year + "-" + month + "-" + day;
    await axios.get("https://statsapi.web.nhl.com/api/v1/schedule?date=" + date).then(async (response) => {
        console.log('Got Response')
        var games = response.data.dates[0].games;
        const fields = [];
        for (var i = 0; i < games.length; i++) {
            var game = games[i];
            var awayTeam = game.teams.away.team.name;
            var homeTeam = game.teams.home.team.name;
            var awayScore = game.teams.away.score;
            var homeScore = game.teams.home.score;
            var hmemoji = await client.emojis.cache.find(emoji => emoji.name === homeTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
            var awemoji = await client.emojis.cache.find(emoji => emoji.name === awayTeam.replace(/\s/g, '').replace(".", "").replace("é", "e"));
            var status = game.status.detailedState;
            var result = (status == "Final") ? `\n**Result**\n${hmemoji} ${homeTeam} ${homeScore}-${awayScore} ${awemoji} ${awayTeam}` : "";
            var time = game.gameDate;
            fields.push({ name: `${awemoji} ${awayTeam} @ ${hmemoji} ${homeTeam}`, value: `<t:${Math.floor(new Date(time).getTime() / 1000)}>\nID: ${game.gamePk}${result}` , inline: false});
        }
        var embed = new EmbedBuilder()
            .setTitle("Games for " + date)
            .addFields(fields)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    })
} 