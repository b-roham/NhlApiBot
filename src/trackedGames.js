import {getGame} from "./getGame.js"

export const currentGames = [];
export async function init(){
  const list = [];
  list = await getGame();
  for (var i = 0; i < list.length; i++){
    if (list[i].status != "Final" && list[i].status != "Scheduled"){
      currentGames.push(list[i]);
    }
  }
  
}
