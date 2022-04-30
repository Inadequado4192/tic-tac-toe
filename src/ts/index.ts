import { io } from "socket.io-client";
import { StartGameResult as StartGameResult, TurnResult } from "../../g";
import { connected, disconnected, gameDiv, gameField, opponentDisconnectAlert, show, waitPlayerDiv } from "./elements";
import { Game } from "./init";

// please note that the types are reversed
export const socket = io();

// (window as any).socket = socket;


socket.io.on("reconnect", () => {
    // console.log("reconnect...");
});

socket.on("connect", () => connected());
socket.on("connect_error", () => {
    disconnected();
    if (Game.playing) Game.End();
});

socket.on("find-lobby-result", () => {
    show(waitPlayerDiv);
});

socket.on("start-game", (result: StartGameResult) => {
    show(gameDiv);
    Game.Start(result);
});
socket.on("opponent-disconnect", () => {
    Game.End();

    opponentDisconnectAlert.classList.add("_show");
    setTimeout(() => opponentDisconnectAlert.classList.remove("_show"), 5000);
});
socket.on("turn-result", (turnResult: TurnResult) => {
    gameField.querySelector(`.f${turnResult.block.x}${turnResult.block.y}`)?.classList.add(turnResult.block.char);
    if (turnResult.type == "EndGame") {
        alert(turnResult.message);
        Game.End();
    } else {
        Game.yourTurn = turnResult.yourTurn;
        if (turnResult.yourTurn) gameField.classList.add("your-turn");
        else gameField.classList.remove("your-turn");
    }
});

(async () => {
    await import("./init");
})();




// DEV

// (window as any).showLobbys = function () {
//     socket.emit("dev-lobby");
//     socket.once("dev-lobby", console.log);
// }