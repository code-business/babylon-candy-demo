enum JewelType {
  "green-triangle",
  "golder-start",
  "blue-circle",
  "red-hexagon",
  "purple-square",
}

enum PowerUpNames {
  "bomb",
  "eyes",
  "double-points",
  "freeze-time",
  "switch",
  "tornado",
}

enum PowerUpActions {
  "destroys-block-of-4-Gems",
  "highlights-all-possible-moves",
  "2x-points-3seconds",
  "stop-your-timer-3seconds",
  "swap-any-2-tiles",
  "reshuffle-board",
}

type Jewel = {
  x: number;
  y: number;
  type: JewelType;
};

type PowerUp = {
  name: PowerUpNames;
  action: PowerUpActions;
};

type Player = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  moveNumber: number;
  colour: "red" | "blue";
  powerUps: PowerUp[];
  // this will be hardcoded to 10 as of now
  betCoins: number;
  online: boolean;
  // game has to be aborted if offlineTime is more than x seconds
  offlineTime: Date | null;
};

type GameBoard = {
  player1: Player;
  player2: Player;
  startTime: Date;
  rewardCoins: 20;
  playerTurn: 1 | 2;
  gameMoveNumber: number;
  gameStatus: "progress" | "completed" | "aborted";
  winnerId: string | null;
  grids: Jewel[][];
};
