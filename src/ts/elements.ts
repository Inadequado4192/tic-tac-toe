let elem = <E extends HTMLElement = HTMLElement>(selectors: string) => document.querySelector(selectors) as E;
let btn = (selectors: string) => elem<HTMLButtonElement>(selectors);

export const reconnectAlert = elem("#reconnect-alert");
export const opponentDisconnectAlert = elem("#opponent-disconnect-alert");
export const startGame = btn("#start-game");
export const mainMenuDiv = elem("#main-menu");
export const waitPlayerDiv = elem("#wait-player");
export const gameDiv = elem("#game");
export const gameField = elem("#game #field")




export function show(bodyDiv: HTMLElement) {
    document.querySelector("body > .show")?.classList.remove("show");
    bodyDiv.classList.add("show");
}

export function connected() {
    document.body.classList.remove("disconnected");
    document.body.classList.add("connected");
    startGame.removeAttribute("disabled");
}
export function disconnected() {
    document.body.classList.remove("connected");
    document.body.classList.add("disconnected");
    startGame.setAttribute("disabled", "");
}



