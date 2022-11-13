import { SlashCommandBuilder } from "discord.js";
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName("getschedule")
    .setDescription("Gets todays NHL Schedule.")
    .addStringOption((option) => option.setName("date").setDescription("The date to get the schedule for.").setRequired(false));
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
        day = date.getDate() + 1;
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
            var status = game.status.detailedState;
            var result = (status == "Final") ? `\n**Result**\n${homeTeam} ${homeScore}-${awayScore} ${awayTeam}` : "";
            var time = game.gameDate;
            fields.push({name: awayTeam + " @ " + homeTeam, value: `<t:${Math.floor(new Date(time).getTime() / 1000)}>\nID: ${game.gamePk}${result}` , inline: false});
        }
        var embed = new EmbedBuilder()
            .setTitle("Games for " + date)
            .addFields(fields)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    })
} 