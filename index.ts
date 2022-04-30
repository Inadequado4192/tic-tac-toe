import express from "express";
import { Server, Socket } from "socket.io";
import path from "path";
import { NextTurn, StartGameResult, TurnResult } from "./g";


const app = express();
let server = app.listen(5000, () => {
    console.log("Site: http://localhost:5000/")
});

//broadcast
const io = new Server(server);
io.on("connection", (socket) => {
    socket.on("find-lobby", () => {
        let lobby = Lobby.users.get(socket.id) ?? Lobby.findFreeLobby()?.[1];

        if (!lobby) lobby = new Lobby(socket);
        else if (lobby.setPlayer(socket)) {
            io.sockets.sockets.get(lobby.firstPlayer.id)?.emit("start-game", <StartGameResult>{
                yourTurn: true,
                lobbyId: lobby.id,
                char: lobby.getMyChar(lobby.firstPlayer.id)
            });
            io.sockets.sockets.get(lobby.secondPlayer.id)?.emit("start-game", <StartGameResult>{
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
        if (!lobby) return;
        if (lobby.isReady()) {
            let anotherPlaeyer = lobby.getOpponent(socket.id);
            io.sockets.sockets.get(anotherPlaeyer.id)?.emit("opponent-disconnect");
            lobby.destroy()
        } else lobby.deletePlayer(socket);
    });
    socket.on("turn", (block: NextTurn["block"]) => {
        let lobby = Lobby.users.get(socket.id) as Lobby;
        let opponent = lobby.getOpponent(socket.id) as Socket;
        const res = lobby.setMatrixChar(block.x, block.y, block.char);
        socket.emit("turn-result", <TurnResult>(!res ? {
            block, yourTurn: false, type: "NextTurn"
        } : { block, message: res, type: "EndGame" }));
        opponent.emit("turn-result", <TurnResult>(!res ? {
            block, yourTurn: true, type: "NextTurn"
        } : { block, message: res == "tie" ? "tie" : "defeat", type: "EndGame" }));

        res && lobby.destroy();
    });
    // socket.on("dev-lobby", () => socket.emit("dev-lobby", Lobby.lobbys, Lobby.users));
});

// setInterval(() => {
//     console.log({
//         lobbys: Lobby.lobbys,
//         users: Lobby.users
//     });
// }, 1000);

type MatrixChar = " " | "x" | "o"
type Matrix = [
    [MatrixChar, MatrixChar, MatrixChar],
    [MatrixChar, MatrixChar, MatrixChar],
    [MatrixChar, MatrixChar, MatrixChar],
]
class Lobby {
    static lobbys = new Map<string, Lobby>();
    static users = new Map<string, Lobby>();
    static findFreeLobby() { return [...this.lobbys.entries()].find(a => !a[1].isReady()); }

    public firstPlayer: Socket | null = null;
    public secondPlayer: Socket | null = null;

    private matrix: Matrix = [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
    ]
    public setMatrixChar(x: 0 | 1 | 2, y: 0 | 1 | 2, c: "x" | "o") {
        this.matrix[y][x] = c;

        // Check Line
        for (let x = 0; x < 3; x++) {
            if (c != this.matrix[y][x]) break;
            if (x == 2) return "win";
        }
        // Check Column
        for (let y = 0; y < 3; y++) {
            if (c != this.matrix[y][x]) break;
            if (y == 2) return "win";
        }
        // Check Diagonal \
        for (let x = 0, y = 0; x < 3; x++, y++) {
            if (c != this.matrix[y][x]) break;
            if (x == 2) return "win";
        }
        // Check Diagonal /
        for (let x = 0, y = 2; x < 3; x++, y--) {
            if (c != this.matrix[y][x]) break;
            if (x == 2) return "win";
        }
        
        main: for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++)
                if (this.matrix[y][x] == " ") break main;
            if (y == 2) return "tie";
        }
    }

    public id = Date.now() + (Math.random() * 1000).toFixed(5);
    constructor(firstPlayer: Socket) {
        this.setPlayer(firstPlayer);
        Lobby.lobbys.set(this.id, this);
    }

    public setPlayer(player: Socket): this is ReadyLobby {
        if ((!this.firstPlayer || this.firstPlayer?.id == player.id) && this.secondPlayer?.id != player.id) this.firstPlayer = player;
        else if (!this.secondPlayer || this.secondPlayer.id == player.id) this.secondPlayer = player;
        Lobby.users.set(player.id, this);
        return this.isReady();
    }
    public deletePlayer(player: Socket): this is ReadyLobby {
        if (this.firstPlayer?.id == player.id) this.firstPlayer = null;
        else if (this.secondPlayer?.id == player.id) this.secondPlayer = null;
        Lobby.users.delete(player.id);
        if (!this.firstPlayer && !this.secondPlayer) this.destroy();
        return this.isReady();
    }
    public isReady(): this is ReadyLobby {
        return !!(this.firstPlayer && this.secondPlayer);
    }
    public destroy() {
        this.firstPlayer && Lobby.users.delete(this.firstPlayer.id);
        this.secondPlayer && Lobby.users.delete(this.secondPlayer.id);
        Lobby.lobbys.delete(this.id);
    }
    public getOpponent(playerId: string) {
        return (this.firstPlayer?.id == playerId ? this.secondPlayer : this.firstPlayer) as Socket;
    }
    public getMyChar(playerId: string): StartGameResult["char"] {
        if (playerId == this.firstPlayer?.id) return "x";
        else return "o";
    }
}
interface ReadyLobby {
    firstPlayer: Socket;
    secondPlayer: Socket;
}




app.use(
    express.static(path.join(__dirname, "node_modules")),
    express.static(path.join(__dirname, "src"))
);
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "src/index.html"));
});