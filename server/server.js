require("dotenv").config();


const http = require("http");
const path = require("path");
const crypto = require("crypto");
const mysql = require("mysql");
const express = require("express");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const { Game } = require('./game.js');


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sockets = {};

const onlineUsers = {};
const updateUsers = (s) => {s.emit('update-users', onlineUsers);};
const tables = {};
const updateTables = (s) => s.emit('update-tables', tables);
const events = {};
const updateEvents = (s) => {s.emit('update-events', events);};

// TODO: refactor message handling
const messages = [];
const updateMessages = (s) => s.emit('update-messages', {list: messages, chat: 'main'});
const updateGroupMessages = (id, list) => io.to(id).emit('update-messages', {list: list, chat: id});

app.use(fileUpload());

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "../sync-skat/build")));

let dbConnected = false;
let con = mysql.createConnection({
    host: process.env.PUBLIC_IP,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: "sync_skat",
});

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
setInterval(() => {
    const currentTime = new Date();
    for(let e of Object.values(events)) {
        if(!e.startDate || e.status !== 'Waiting') continue;

        const eventTime = new Date(e.startDate);
        const timeDiff = eventTime.getTime() - currentTime.getTime();

        if(timeDiff < minute * 5) {
            let mins = Math.floor(timeDiff / minute);
            let secs = Math.ceil((timeDiff % minute) / second);

            if(secs === 60) {
                mins++;
                secs = 0;
            }

            e.startsIn = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }
    updateEvents(io);

    if(messages.length > 0 && currentTime.getTime() - messages[0].time > 1000 * 60 * 60) {
        messages.shift();
    } 
}, 1000);

con.connect(function (err) {
    if (err) throw err;
    dbConnected = true;
});

const joinTable = (socket, table, data) => {
    if(table.players[data.slot] === '') {
        table.players[data.slot] = {
            username: data.username,
            profile_pic: data.img,
            country: data.country
        };
        onlineUsers[data.username].status = 'TableWaiting';
        onlineUsers[data.username].chats.push([data.id, 1]);
        updateTables(io);
        updateUsers(io);

        
        socket.join(data.id);
        table.messages.push({
            content: `${data.username} joined the table`,
            user: 'system',
            time: Date.now()
        });
        updateGroupMessages(data.id, table.messages);

        // TEMP
        if(table.players.indexOf('') === -1) {

            table.messages.push({
                content: `Table filled! Your game will begin in 5 seconds`,
                user: 'system',
                time: Date.now()
            });
            updateGroupMessages(data.id, table.messages);
            io.to(data.id).emit('focus-chat', data.id);

            setTimeout(() => {
                if(table.players.indexOf('') === -1) {
                    for(let p of table.players) {
                        onlineUsers[p.username].status = 'InGame';
                        onlineUsers[p.username].table = data.id;
                        p.loaded = false;
                    }

                    updateUsers(io);
                    
                    tables[data.id].game = new Game(table.players, table.rounds, data.id);
                    io.to(data.id).emit('start-game');    
                }
            }, 5000);
        }
    }
}

const joinEvent = (socket, event, data) => {
    event.players.push({
        username: data.username,
        profile_pic: data.img,
        country: data.country
    });

    onlineUsers[data.username].status = 'EventWaiting';
    onlineUsers[data.username].chats.push([data.id, 2]);
    updateEvents(io);
    updateUsers(io);

    socket.join(data.id);
    event.messages.push({
        content: `${data.username} joined`,
        user: 'system',
        time: Date.now()
    });
    updateGroupMessages(data.id, event.messages);
}


io.on("connection", (socket) => {
    sockets[socket.id] = socket;
    socket.on("user-info", info => {
        let userData = {...info};
        if(!onlineUsers[info.username]) {
            userData.status = 'Online';
            userData.chats = [];
            onlineUsers[info.username] = userData;
        }
        sockets[socket.id].user = info.username;
        for(let chat of onlineUsers[info.username].chats) {
            socket.join(chat);
        }
        updateUsers(io);
    });

    socket.on('check-user-status', () => {
        if(socket.user && onlineUsers[socket.user]) {
            socket.emit('user-status', onlineUsers[socket.user].status);
        }
    });

    // mass retrieve when page first loads
    socket.on("get-data", user => {
        updateUsers(socket);
        updateTables(socket);
        updateEvents(socket);

        if(user && onlineUsers[user]) {
            let lists = [messages];
            let chats = [['main', 'Lobby']];
            for(let chat of onlineUsers[user].chats) {
                let chatLabel = 'Lobby';
                if(chat[1] === 1) {
                    lists.push(tables[chat[0]].messages);
                    chatLabel = 'Table';
                    socket.join(chat[0]);
                }
                if(chat[1] === 2) {
                    lists.push(events[chat[0]].messages);
                    chatLabel = events[chat[0]].name;
                    socket.join(chat[0]);
                }
                chats.push([chat[0], chatLabel]);
            }
            socket.emit('update-all-messages', {lists: lists, chats: chats});
        }
    });

    socket.on('create-group', (body) => {
        let group = {
            public: body.public,
            tableSize: body.tableSize,
            rounds: body.rounds,
            players: body.joinAsPlayer ? [{
                username: body.username,
                profile_pic: body.img,
                country: body.country
            }] : [],
            status: 'Waiting',
            id: crypto.randomBytes(4).toString("hex"),
            messages: [],
            started: false
        };

        if(!body.public) {
            group.password = body.password;
        }

        if(body.type === 'Table') {

            // fill table with empty slots
            for(let i = 1; i < body.tableSize; i++) {
                group.players.push('');
            }
            tables[group.id] = group;
            onlineUsers[socket.user].status = 'TableWaiting';
            updateTables(io);

        } else if(body.type === 'Event') {
            group.name = body.name;
            group.sync = body.sync;
            group.startMethod = body.startMethod;
            group.startDate = body.startDate;
            group.host = {
                username: body.username,
                profile_pic: body.img,
                country: body.country
            };

            onlineUsers[socket.user].status = body.joinAsPlayer ? 'EventWaiting' : onlineUsers[socket.user].status;
            events[group.id] = group;
            updateEvents(io);
        }
        
        onlineUsers[socket.user].chats.push([group.id, body.type === 'Table' ? 1 : 2]);
        socket.join(group.id);
        group.messages.push({
            content: `${socket.user} created ${body.name ? body.name : 'the table'}`,
            user: 'system',
            time: Date.now()
        });
        updateGroupMessages(group.id, group.messages);
        updateUsers(io);
        socket.emit('group-created', { id: group.id, label: body.type === 'Table' ? 'Table' : group.name });
    });

    socket.on('join-table', (data) => {
        const table = tables[data.id];
        joinTable(socket, table, data);
    });

    socket.on('send-password', data => {
        if(data.type === 'table') {
            if(data.value === tables[data.id].password) {
                joinTable(socket, tables[data.id], data);
                socket.emit('right-password', {id: data.id, label: 'Table'});
            } else {
                socket.emit('wrong-password');
            }
        } else if(data.type === 'event') {
            if(data.value === events[data.id].password) {
                joinEvent(socket, events[data.id], data);
                socket.emit('right-password', {id: data.id, label: events[data.id].name});
            } else {
                socket.emit('wrong-password');
            }
        }
    });

    socket.on('leave-table', data => {
        const table = tables[data.id];
        const playerSlot = table.players.findIndex(p => p.username === data.username);

        if(playerSlot !== -1) {
            table.players[playerSlot] = '';
            if(table.players.filter(p => p === '').length === table.tableSize) {
                delete tables[data.id];
            }
            onlineUsers[data.username].status = 'Online';
            onlineUsers[data.username].chats = onlineUsers[data.username].chats.filter(c => c[0] !== data.id);
            updateTables(io);
            updateUsers(io);

            socket.leave(data.id);
            table.messages.push({
                content: `${data.username} left the table`,
                user: 'system',
                time: Date.now()
            });
            updateGroupMessages(data.id, table.messages);
        }
    });

    socket.on('join-event', data => {
        joinEvent(socket, events[data.id], data);
    });

    socket.on('leave-event', data => {
        const event = events[data.id];

        onlineUsers[data.username].status = 'Online';
        event.players = [...event.players.filter(p => p.username !== data.username)];
        onlineUsers[data.username].chats = onlineUsers[data.username].chats.filter(c => c[0] !== data.id);
        updateEvents(io);
        updateUsers(io);

        socket.leave(data.id);
    });

    socket.on('remove-event', data => {
        const event = events[data.id];
        for(let p of event.players) {
            onlineUsers[p.username].status = 'Online';
            onlineUsers[p.username].chats = onlineUsers[p.username].chats.filter(c => c[0] !== data.id);
            io.to(data.id).emit('event-removed', data.id);
        }
        io.socketsLeave(data.id);

        delete events[data.id];
        updateEvents(io);
        updateUsers(io);
    });

    socket.on('send-message', data => {
        let message = {
            content: data.msg,
            user: data.user,
            time: Date.now()
        };
        if(data.chatType === 0) {
            messages.push(message);
            updateMessages(io);
        } else if(data.chatType === 1) {
            tables[data.chat].messages.push(message);
            updateGroupMessages(data.chat, tables[data.chat].messages);
        } else if(data.chatType === 2) {
            events[data.chat].messages.push(message);
            updateGroupMessages(data.chat, events[data.chat].messages);
        }
    });

    socket.on('get-game-data', usr => {
        if(onlineUsers[usr] && tables[onlineUsers[usr].table]) {
            const table = tables[onlineUsers[usr].table];
            socket.emit('load-game', table.game);

            for(let p of table.players) {
                if(p.username === usr) {
                    p.loaded = true;
                }
            }
            if(table.players.filter(p => p.loaded).length === table.players.length && !table.started) {
                table.game.startHand(io.to(onlineUsers[usr].table));
                table.started = true;
            }
        } else {
            socket.emit('disconnected', 'The game quit unexpectedly and you have been disconnected');
        }
    });

    // TODO: potentially refactor to house game logic listeners in game.js

    socket.on('bid', bid => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;
            g.bid = bid;
            g.players[g.bidder].bid = bid;
            g.players[g.bidder].status = 'await';
            g.players[g.listener].status = 'accept';
            io.to(onlineUsers[socket.user].table).emit('bid-update', {
                bid: g.bid,
                players: g.players
            });
        }
    });

    socket.on('accept', () => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;
            g.players[g.bidder].status = 'bid';
            g.players[g.listener].bid = g.bid;
            g.players[g.listener].status = 'await';
            io.to(onlineUsers[socket.user].table).emit('bid-update', {
                bid: g.bid,
                players: g.players
            });
        }
    });

    socket.on('pass', (data) => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;

            // all pass
            if(g.players[data.pIndex].status === 'playorpass') {
                io.to(onlineUsers[socket.user].table).emit('pass-update', {
                    allPass: true,
                    isComplete: g.handNumber === g.totalHands
                });

                g.results = {allPass: true, isComplete: g.handNumber === g.totalHands};
                g.status = 'results';
                g.pastHands.push({player: -1});

                io.to(onlineUsers[socket.user].table).emit('score-update', {
                    pastHands: g.pastHands
                });

                if(g.handNumber === g.totalHands) {
                    endGame(g.tableId, g.totalHands, g.eventId, g.players);
                }
            }

            g.players[data.pIndex].status = 'passed';
            g.players[data.pIndex].bidding = false;
            g.players[data.pIndex].passed = true;

            let winner = -1, newBidder = -1, newListener = -1;

            let rear = g.players.find(p => p.position === 2);

            if(data.position !== 2) {
                if(rear.index === g.bidder) {
                    winner = rear.index;
                } else {
                    newBidder = rear.index;
                }
            } else {
                winner = g.listener;
            }

            // FH passes to MH
            if(data.position === 0 && g.players[g.bidder].position === 1) {
                newBidder = rear.index;
                newListener = g.bidder;
            }

            if(winner !== -1) {
                g.players[winner].status = g.bid === -1 ? 'playorpass' : 'pickup';
            }
            if(newBidder !== -1) {
                g.players[newBidder].status = 'bid';
                g.bidder = newBidder;
            }
            if(newListener !== -1) {
                g.listener = newListener;
            }

            io.to(onlineUsers[socket.user].table).emit('pass-update', {
                bidder: g.bidder,
                listener: g.listener,
                players: g.players
            });
        }
    });

    // FH decides to play after MH and RH have already passed
    socket.on('fhPlay', ind => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;
            g.players.forEach(p => p.status = 'idle');
            g.players[ind].status = 'pickup';
            g.players[ind].bid = 0; // bid 18 (first in sequence)
            g.bid = 0;

            io.to(onlineUsers[socket.user].table).emit('bid-update', {
                bid: g.bid,
                players: g.players
            });
        }
    });

    socket.on('pickup', ind => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;
            g.players.forEach(p => p.status = 'idle');
            g.players[ind].status = 'declare';
            g.players[ind].cards.push(...g.skat);
            g.skat = [];

            io.to(onlineUsers[socket.user].table).emit('pickup-update', {
                players: g.players
            });
        }
    });

    socket.on('handGame', ind => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;
            g.players.forEach(p => p.status = 'idle');
            g.players[ind].status = 'declare';
            g.handDetails.hand = true;

            io.to(onlineUsers[socket.user].table).emit('hand-update', {
                players: g.players
            });
        }
    });

    socket.on('announce', data => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;

            g.currentPlayer = g.players.findIndex(p => p.position === 0);
            g.bidder = data.pIndex;
            g.status = 'playing';
            g.players.forEach(p => p.status = 'idle');
            g.players[g.currentPlayer].status = 'playing';
            
            g.skat.push(...data.skat);
            g.players[data.pIndex].cards = g.players[data.pIndex].cards.filter(c => !data.skat.includes(c));

            g.handDetails.trumpSuit = data.handDetails.trumpSuit;
            g.handDetails.matadors = data.handDetails.matadors;
            g.handDetails.hand = data.handDetails.hand;
            g.handDetails.schneiderAnnounced = data.handDetails.schneiderAnnounced;
            g.handDetails.schwarzAnnounced = data.handDetails.schwarzAnnounced;
            g.handDetails.ouvert = data.handDetails.ouvert;

            if(data.handDetails.ouvert) {
                g.players[data.pIndex].handOpen = true;
            }

            io.to(onlineUsers[socket.user].table).emit('announce-update', {
                players: g.players,
                skat: g.skat,
                bidder: g.bidder,
                status: g.status,
                currentPlayer: g.currentPlayer,
                handDetails: g.handDetails
            });
        }
    });

    socket.on('play-card', card => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            tables[onlineUsers[socket.user].table].game.playCard(io.to(onlineUsers[socket.user].table), card, endGame);
        }
    });

    socket.on('ready-for-next', ind => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;
            g.players[ind].status = 'ready';

            

            if(g.players.filter(p => p.status === 'ready').length === g.players.length) {
                g.startHand(io.to(onlineUsers[socket.user].table));
            } else {
                io.to(onlineUsers[socket.user].table).emit('status-update', {
                    players: g.players,
                    status: g.status
                });
            }
        }
    });

    socket.on('get-scores', () => {
        if(onlineUsers[socket.user] && tables[onlineUsers[socket.user].table]) {
            const g = tables[onlineUsers[socket.user].table].game;
            socket.emit('score-update', {
                pastHands: g.pastHands
            });
        }
    });

    socket.on("disconnect", () => {
        setTimeout(() => {
            const socketCount = Object.values(sockets).filter(s => s.user === socket.user).length;
            if(socketCount === 0) {
                delete onlineUsers[socket.user];
                updateUsers(io);
            }
        }, 1000 * 60 * 60);
        delete sockets[socket.id];
    });
});

app.post("/api/upload", (req, res) => {
    const pfp = req.files.pfp;
    const username = req.header("username");

    const newFileName = crypto.randomBytes(20).toString("hex");
    const pathToImage = `/photos/${newFileName}${path.extname(pfp.name)}`;

    pfp.mv(__dirname + "/public/" + pathToImage);

    con.query(
        `UPDATE users SET profile_pic='${pathToImage}' WHERE username='${username}'`,
        (err, qRes, fields) => {
            res.send(pathToImage);
        }
    );
});

const endGame = (id, hands, eventId, players) => {
    const startDate = new Date();

    const startDateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${
        String(startDate.getDate()).padStart(2, '0')} ${String(startDate.getHours()).padStart(2, '0')}:${
        String(startDate.getMinutes()).padStart(2, '0')}:${String(startDate.getSeconds()).padStart(2, '0')}`;

    con.query(`INSERT INTO tables (id, date, hands, eventId) VALUES (
        '${id}', '${startDateString}', ${hands}, '${eventId}'
    )`, (err, result, fields) => {
        if(err) throw Error(err);

        let playRecordQuery = 'INSERT INTO playRecords (tableId, username, score, wins, losses) VALUES ';
        players.forEach((p, ind) => {
            playRecordQuery += `('${id}', '${p.name}', ${p.score}, ${p.wins}, ${p.losses})`;
            if(ind !== players.length - 1) {
                playRecordQuery += ', ';
            } else {
                playRecordQuery += ';';
            }
        });
        con.query(playRecordQuery, (err2, result2, fields2) => {
            if(err2) throw Error(err2);

            for(let p of players) {
                onlineUsers[p.name].status = 'Online';
                onlineUsers[p.name].chats = onlineUsers[p.name].chats.filter(c => {c[0] !== id});
            }

            delete tables[id];

            updateTables(io);
            updateUsers(io);
        });
    });
}



app.get("/api/user-info", (req, res) => {
    if (dbConnected) {
        const username = req.header("username");
        const pic = req.header("auth0Pic");

        con.query(
            "SELECT * FROM users WHERE username = ?",
            [username],
            (err, res1, fields) => {
                if (err) res.send(err);
                else {
                    // create new user if not found
                    if (res1.length === 0) {
                        con.query(
                            "INSERT INTO users (username, profile_pic) VALUES (?, ?)",
                            [username, pic],
                            (e, res2, fields) => {
                                res.send({ username: username, profile_pic: pic });
                            }
                        );
                    } else {
                        res.send(res1[0]);
                    }
                }
            }
        );
    }
});

app.get("/api/group-results", (req, res) => {
    if(dbConnected) {
        const groupId = req.header('id');
        con.query(
            `SELECT * FROM playRecords p 
            JOIN users u ON p.username = u.username 
            WHERE tableId = '${groupId}' OR eventId = '${groupId}'
            ORDER BY p.score DESC`, (e, res1, fields) => {
            
            if(e) throw Error(e);
            res.send(res1);
        });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../sync-skat/build/index.html"));
});

server.listen(5000);
