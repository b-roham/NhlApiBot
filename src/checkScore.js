const axios = require('axios');
const api = "https://statsapi.web.nhl.com/";

module.exports.checkScore = async function checkScore(gameID) {
    var homeScore = 0;
    var awayScore = 0;
    var currentPeriod;
    var currentPeriodOrdinal;
    var currentPeriodTimeRemaining;
    
    await axios.get(api + "api/v1/game/" + gameID + "/feed/live").then(async (resp) => {
      var data = resp.data;
      currentPeriod = data.liveData.linescore.currentPeriod;
      currentPeriodOrdinal = data.liveData.linescore.currentPeriodOrdinal;
      currentPeriodTimeRemaining = data.liveData.linescore.currentPeriodTimeRemaining;
      Object.entries(resp.data.liveData.linescore).forEach(async ([key, value]) => {
        if (key == "teams") {
          Object.entries(value).forEach(async ([key2, value2]) => {
            if (key2 == "home") {
              var team = value2.team.name;
              Object.entries(value2).forEach(async ([key3, value3]) => {
                if (key3 == "goals") {
                  if (team == "Boston Bruins") {
                    homeScore = value3;
                  } else {
                    awayScore = value3;
                  }
                }
              });
            }
            if (key2 == "away") {
              var team = value2.team.name;
              Object.entries(value2).forEach(async ([key3, value3]) => {
                if (key3 == "goals") {
                  if (team == "Boston Bruins") {
                    homeScore = value3;
                  } else {
                    awayScore = value3;
                  }
                }
              });
            }
          });
        }
      });
    });
    return [homeScore, awayScore, currentPeriod, currentPeriodOrdinal, currentPeriodTimeRemaining];
}
