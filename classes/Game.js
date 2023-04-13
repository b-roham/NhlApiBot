/**
 * @class Game
 * @classdesc A class representing an NHL game
 * @property {string} homeTeam - The name of the home team
 * @property {string} awayTeam - The name of the away team
 * @property {string} status - The status of the game
 * @property {number} homeScore - The score of the home team
 * @property {number} awayScore - The score of the away team
 * @property {number} gamePk - The gamePk of the game
 */
export class Game {
    /**
     * @param {string} homeTeam - The name of the home team
     * @param {string} awayTeam - The name of the away team 
     * @param {string} status - The status of the game 
     * @param {number} homeScore - The score of the home team
     * @param {number} awayScore - The score of the away team 
     * @param {number} gamePk  - The gamePk of the game
     */
    constructor(homeTeam, awayTeam, status, homeScore, awayScore, gamePk, homeRecord, awayRecord, homeID, awayID, date) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.status = status;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.gamePk = gamePk;
        this.homeRecord = homeRecord;
        this.awayRecord = awayRecord;
        this.homeID = homeID;
        this.awayID = awayID;
        this.dateClass = new Date(date);
    }
    /**
     * @returns {string} The Score of the Bruins
    **/
    get HomeScore(){
        return this.homeScore;
    }
    /**
     * @returns {string} The Score of the Opponent
    **/
    get AwayScore(){
        return this.awayScore;
    }
    /**
     * @returns {Array<number>} The score of the game in the form [homeScore, awayScore]
     **/
    get GameScore(){
        return [this.homeScore, this.awayScore];
    }
    get AwayTeam(){
        return this.awayTeam;
    }
    get HomeTeam(){
      return this.homeTeam;
    }
}