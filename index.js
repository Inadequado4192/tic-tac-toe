"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
let server = app.listen(process.env.PORT || 5000, () => {
    console.log("Site: http://localhost:5000/");
});
const io = new socket_io_1.Server(server);
io.on("connection", (socket) => {
    socket.on("find-lobby", () => {
        let lobby = Lobby.users.get(socket.id) ?? Lobby.findFreeLobby()?.[1];
        if (!lobby)
            lobby = new Lobby(socket);
        else if (lobby.setPlayer(socket)) {
            io.sockets.sockets.get(lobby.firstPlayer.id)?.emit("start-game", {
                yourTurn: true,
                lobbyId: lobby.id,
                char: lobby.getMyChar(lobby.firstPlayer.id)
            });
            io.sockets.sockets.get(lobby.secondPlayer.id)?.emit("start-game", {
                yourTurn: false,
                lobbyId: lobby.id,
                char: lobby.getMyChar(lobby.secondPlayer.id)
            });
            return;
        }
        io.sockets.sockets.get(socket.id)?.emit("find-lobby-result");
    });
    socket.on("disconnect", () => {
        let lobby = Lobby.users.get(socket.id);
        if (!lobby)
            return;
        if (lobby.isReady()) {
            let anotherPlaeyer = lobby.getOpponent(socket.id);
            io.sockets.sockets.get(anotherPlaeyer.id)?.emit("opponent-disconnect");
            lobby.destroy();
        }
        else
            lobby.deletePlayer(socket);
    });
    socket.on("turn", (block) => {
        let lobby = Lobby.users.get(socket.id);
        let opponent = lobby.getOpponent(socket.id);
        const res = lobby.setMatrixChar(block.x, block.y, block.char);
        socket.emit("turn-result", (!res ? {
            block, yourTurn: false, type: "NextTurn"
        } : { block, message: res, type: "EndGame" }));
        opponent.emit("turn-result", (!res ? {
            block, yourTurn: true, type: "NextTurn"
        } : { block, message: res == "tie" ? "tie" : "defeat", type: "EndGame" }));
        res && lobby.destroy();
    });
});
class Lobby {
    static lobbys = new Map();
    static users = new Map();
    static findFreeLobby() { return [...this.lobbys.entries()].find(a => !a[1].isReady()); }
    firstPlayer = null;
    secondPlayer = null;
    matrix = [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
    ];
    setMatrixChar(x, y, c) {
        this.matrix[y][x] = c;
        for (let x = 0; x < 3; x++) {
            if (c != this.matrix[y][x])
                break;
            if (x == 2)
                return "win";
        }
        for (let y = 0; y < 3; y++) {
            if (c != this.matrix[y][x])
                break;
            if (y == 2)
                return "win";
        }
        for (let x = 0, y = 0; x < 3; x++, y++) {
            if (c != this.matrix[y][x])
                break;
            if (x == 2)
                return "win";
        }
        for (let x = 0, y = 2; x < 3; x++, y--) {
            if (c != this.matrix[y][x])
                break;
            if (x == 2)
                return "win";
        }
        main: for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++)
                if (this.matrix[y][x] == " ")
                    break main;
            if (y == 2)
                return "tie";
        }
    }
    id = Date.now() + (Math.random() * 1000).toFixed(5);
    constructor(firstPlayer) {
        this.setPlayer(firstPlayer);
        Lobby.lobbys.set(this.id, this);
    }
    setPlayer(player) {
        if ((!this.firstPlayer || this.firstPlayer?.id == player.id) && this.secondPlayer?.id != player.id)
            this.firstPlayer = player;
        else if (!this.secondPlayer || this.secondPlayer.id == player.id)
            this.secondPlayer = player;
        Lobby.users.set(player.id, this);
        return this.isReady();
    }
    deletePlayer(player) {
        if (this.firstPlayer?.id == player.id)
            this.firstPlayer = null;
        else if (this.secondPlayer?.id == player.id)
            this.secondPlayer = null;
        Lobby.users.delete(player.id);
        if (!this.firstPlayer && !this.secondPlayer)
            this.destroy();
        return this.isReady();
    }
    isReady() {
        return !!(this.firstPlayer && this.secondPlayer);
    }
    destroy() {
        this.firstPlayer && Lobby.users.delete(this.firstPlayer.id);
        this.secondPlayer && Lobby.users.delete(this.secondPlayer.id);
        Lobby.lobbys.delete(this.id);
    }
    getOpponent(playerId) {
        return (this.firstPlayer?.id == playerId ? this.secondPlayer : this.firstPlayer);
    }
    getMyChar(playerId) {
        if (playerId == this.firstPlayer?.id)
            return "x";
        else
            return "o";
    }
}
app.use(express_1.default.static(path_1.default.join(__dirname, "node_modules")), express_1.default.static(path_1.default.join(__dirname, "src")));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "src/index.html"));
});
