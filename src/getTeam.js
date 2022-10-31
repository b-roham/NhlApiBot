import teams from "@nhl-api/teams";

export function getTeamfromID(id) {
    const t = teams.default.filter(team => team.id == id);
    if (t.length > 1) {
        // if the query matches more than 1 team, return the array of players
        return t;
    }else {
        // team found, return the team array
        return t[0];
    }
};