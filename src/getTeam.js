import teams from "@nhl-api/teams";
/**
 * Returns the team object from the teams.default array that matches the given id.           
 * @param {string} id - the id of the team to return          
 * @returns {Array<Object>} - Array of teams from the teams.default array that matches the given id.           
 */
export function getTeamfromID(id) {
    const t = teams.default.filter(team => team.id == id);
    if (t.length > 1) {
        // if the query matches more than 1 team, return the array of teams
        return t;
    }else {
        // team found, return the team's array
        return t[0];
    }
};