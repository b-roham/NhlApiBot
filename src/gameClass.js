import { getTeamfromID } from "./getTeam.js";
import { checkScore } from "./checkScore"
/**
 * A class that represents a hockey game.  
 * @param {string} homeTeam The home team's name
 * @param {string} awayTeam The away team's name
 * @param {string} gamePk The game's Pk (game ID)     
 */
export class hockeyGame {
    constructor(homeTeam, awayTeam, gamePk) {
        this.name = `${awayTeam} @ ${homeTeam}`;
        this.id = gamePk;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeId = getTeamfromID(homeTeam).id;
        this.awayId = getTeamfromID(awayTeam).id;
    }
    /**
     * Gets the score of the user.           
     * @returns {Promise<[number, number]>} - A promise that resolves to the score of the user.           
     */
    async getScore(){
        var s = await checkScore(this.id);
        return [s[0], s[1]];
    }
    /**
     * Gets the period of the user.       
     * @returns {Promise<number>} The period of the user.       
     */
    async getPeriod(){
        var s= await checkScore(this.id);
        return s[2];
    }
}