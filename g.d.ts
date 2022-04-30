export interface StartGameResult {
    lobbyId: string,
    char: "x" | "o",
    yourTurn: boolean
}

export interface NextTurn {
    type: "NextTurn",
    yourTurn: boolean,
    block: { x: 0 | 1 | 2, y: 0 | 1 | 2, char: StartGameResult["char"] }
}
export interface EndGame {
    type: "EndGame",
    message: "win" | "defeat" | "tie"
    block: { x: 0 | 1 | 2, y: 0 | 1 | 2, char: StartGameResult["char"] }
}
export type TurnResult = NextTurn | EndGame;