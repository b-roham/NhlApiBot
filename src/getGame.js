import axios from 'axios';
const get = axios.get;
const api = "https://statsapi.web.nhl.com/";
import {Game} from '../classes/Game.js';
/** 
* Gets the games of a given team for the day.
* @param {number} teamId - The ID of the NHL Team you want to search for, default 6 (Bruins)
* @returns {Promise<Array<Game>>} An array of game Objects for the team 
**/
export async function getGame(teamId = -1){
  var gamesN = [];
  try{
    await get(api + "api/v1/schedule" + ((teamId != -1) ? "?teamId=" + teamId : "")).then(async (resp) => {
      var data = resp.data;
      // If there are no games today, return an empty array
      if (data.totalItems == 0){
        return [];
      }
      var games = data.dates[0].games;
      for (var i = 0; i < games.length; i++){
        var game = new Game(
            games[i].teams.home.team.name, 
            games[i].teams.away.team.name, 
            games[i].status.detailedState, 
            games[i].teams.home.score, 
            games[i].teams.away.score, 
            games[i].gamePk,
            games[i].teams.home.leagueRecord.wins + "-" + games[i].teams.home.leagueRecord.losses,
            games[i].teams.away.leagueRecord.wins + "-" + games[i].teams.away.leagueRecord.losses,
            games[i].teams.home.team.id,
            games[i].teams.away.team.id,
            games[i].gameDate
        );
        //var game = [games[i].teams.home.team.name, games[i].teams.away.team.name, games[i].status.detailedState, games[i].teams.home.score, games[i].teams.away.score];
        gamesN.push(game);
      }
    })
  }catch(err){
    console.log(err);
  }finally{
    return gamesN;
  }
}