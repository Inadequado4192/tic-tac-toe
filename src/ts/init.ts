import { socket } from ".";
import { StartGameResult } from "../../g";
import { gameField, mainMenuDiv, show, startGame } from "./elements";

startGame.addEventListener("click", () => {
    socket.emit("find-lobby");
});


export namespace Game {
    // let lobbyId: string | null;
    let char: StartGameResult["char"] | null;
    export let yourTurn = false;
    export let playing = false;
    export function Start(result: StartGameResult) {
        // lobbyId = _lobbyId;
        char = result.char;
        yourTurn = result.yourTurn;
        if (yourTurn) gameField.classList.add("your-turn");
        playing = true;
        for (let i = 0; i < 9; i++) {
            let div = document.createElement("div");
            let x = Math.floor(i / 3),
                y = i % 3;
            div.classList.add(`f${x}${y}`);
            gameField.append(div);
            div.addEventListener("click", () => {
                if (!yourTurn || div.classList.contains("x") || div.classList.contains("o")) return;

                yourTurn = false;
                socket.emit("turn", { x, y, char });
            });
        }
    }

    export function End() {
        playing = false;
        // lobbyId = null;
        char = null;
        yourTurn = false;

        show(mainMenuDiv);
        gameField.innerHTML = "";
    }
}