import { SlashCommandBuilder } from 'discord.js';
export const name = 'ping';
export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');
export async function execute(interaction) { 
    await interaction.reply("Pong!");
}