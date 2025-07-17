const { Hand } = require('../common/Hand.js');
const utils = require('../common/utils.js');

const CARD_VALUES = [0, 0, 0, 2, 3, 4, 10, 11];
const MULT_VALUES = [23, 24, 9, 10, 11, 12];

const cards = [];
for(let s = 0; s < 4; s++) {
    for(let r = 0; r < 8; r++) {
        cards.push(`${s}${r}`);
    }
}

function loopbackIndex(ind, delta, length) {
	let result = ind + delta;
	if(result >= length) {
		return result - length;
	}
	if(result < 0) {
		return result + length;
	}
	return result;
}

const suit = (card) => Number.parseInt(card.charAt(0));
const rank = (card, trumpSuit) => {
    const cardRank = Number.parseInt(card.charAt(1));
    if(cardRank === 6 && trumpSuit === -2) {
        return 2.5;
    }
    return cardRank;
};

function getHighestCardIndex(cards, currentSuit, trumpSuit) {
    let w = 0;

    // find the highest card in the suit that was played first
    for(let i = 0; i < cards.length; i++) {
        if(suit(cards[i]) === currentSuit && rank(cards[i], trumpSuit) > rank(cards[w], trumpSuit)) {
            w = i;
        }
    }

    // find the highest trump card (if applicable)
    if(currentSuit !== trumpSuit && trumpSuit >= 0) {
        for(let i = 0; i < cards.length; i++) {
            if(suit(cards[i]) === trumpSuit && (suit(cards[w]) !== trumpSuit || rank(cards[i], trumpSuit) > rank(cards[w], trumpSuit))) {
                w = i;
            }
        }
    }
    
    // find the highest jack (if not null)
    if(trumpSuit !== -2) {
        for(let i = 0; i < cards.length; i++) {
            if(rank(cards[i], trumpSuit) === 3 && (rank(cards[w], trumpSuit) !== 3 || suit(cards[i]) > suit(cards[w]))) {
                w = i;
            }
        }
    }

    return w;
}

function cardTotal(piles) {
    let total = 0;
    for(let pile of piles) {
        for(let c of pile) {
            total += CARD_VALUES[Number.parseInt(c.card.charAt(1))];
        }
    }
    return total;
}

const scoreDiff = (won, isBidder, value, ps) => {
    if(won) {
        if(isBidder) {
            return value + 50;
        } else {
            return 0;
        }
    } else {
        if(isBidder) {
            return -value * 2 - 50;
        } else {
            return 120 / ps;
        }
    }
}

class Player {
    constructor(pData, index) {
        this.name = pData.username;
        this.img = pData.profile_pic;
        this.country = pData.country;

        this.index = index; // index in table's list of players

        this.status = 'idle';
        this.passed = false;
        this.bid = -1;
        this.bidding = true;
        this.position = -1; // table position for given hand (forehand, etc)

        this.handOpen = false;

        this.cards = [];
        this.tricks = [];

        this.wins = 0;
        this.losses = 0;
        this.score = 0;
    }
}

class Game {
    constructor(players, rounds, tableId, eventId = null) {
        this.players = [];
        for(let p of players) {
            this.players.push(new Player(p, this.players.length));
        }

        this.status = 'dealing';
        this.isComplete = false;
        this.results;

        // card slots
        this.deck = [];
        this.skat = [];
        this.inPlay = [];

        // hand values
        this.handNumber = 0;
        this.totalHands = rounds * this.players.length;
        this.handDetails = new Hand();

        // bidding values
        this.bid = -1;
        this.bidder = -1;
        this.listener = -1;
        
        // play values
        this.currentSuit = -1;
        this.currentPlayer = -1;

        // ids
        this.tableId = tableId;
        this.eventId = eventId;

        // historical game data
        this.pastHands = [];
        this.lastTrick = [];
    }

    dealCards(startInd) {
        for(let i = 0; i < 3; i++) {
            let cards = this.deck.splice(this.deck.length - 3, 3);
            this.players[loopbackIndex(startInd, i, this.players.length)].cards.push(...cards);
        }
        this.skat = this.deck.splice(this.deck.length - 2, 2);
        for(let i = 0; i < 3; i++) {
            let cards = this.deck.splice(this.deck.length - 4, 4);
            this.players[loopbackIndex(startInd, i, this.players.length)].cards.push(...cards);
        }
        for(let i = 0; i < 3; i++) {
            let cards = this.deck.splice(this.deck.length - 3, 3);
            this.players[loopbackIndex(startInd, i, this.players.length)].cards.push(...cards);
        }
    }

    startHand(socket) {
        this.deck = utils.shuffle([...cards]);
        this.skat = [];
        this.inPlay = [];
        this.bid = -1;
        this.players.forEach(p => { 
            p.cards = []; 
            p.tricks = []; 

            p.status = 'idle';
            p.bid = -1; 
            p.passed = false;
            p.position = -1;
            p.handOpen = false;
        });
        this.handNumber++;

        this.status = 'dealing';

        socket.emit('start-hand', {
            deck: this.deck, 
            handNumber: this.handNumber,
            players: this.players
        });
        
        socket.emit('status-update', {
            status: this.status,
            players: this.players
        });

        const startInd = this.handNumber % this.players.length;
        this.dealCards(startInd); 

        const middle = loopbackIndex(startInd, 1, this.players.length);
        this.players[middle].status = 'bid';
        this.players.forEach((p, ind) => {
            let offsetIndex = ind - startInd;
            if(offsetIndex < 0) offsetIndex += this.players.length;

            p.position = offsetIndex;
        });

        this.bidder = middle;
        this.listener = startInd;

        setTimeout(() => { 
            socket.emit('start-bids', {
                bidder: this.bidder, 
                listener: this.listener, 
                players: this.players
            });

            this.status = 'bidding';
        }, 3200);        
    }

    playCard(socket, card, endGame) {
        const cardSuit = Number.parseInt(card.charAt(0));
        const cardRank = Number.parseInt(card.charAt(1));
        
        // if first card played, set as the suit for the trick
        if(this.inPlay.length === 0) {
            this.currentSuit = cardSuit;
            if(cardRank === 3 && this.handDetails.trumpSuit !== -2) {
                this.currentSuit = this.handDetails.trumpSuit;
            }
        }

        this.players[this.currentPlayer].status = 'idle';
        this.players[this.currentPlayer].cards = this.players[this.currentPlayer].cards.filter(c => c !== card);
        this.inPlay.push({id: this.currentPlayer, card: card});

        let nextPlayer = -1;
        if(this.inPlay.length < 3) {
            nextPlayer = loopbackIndex(this.currentPlayer, 1, this.players.length);
            if(this.players[nextPlayer].position === 3) 
                nextPlayer = loopbackIndex(nextPlayer, 1, this.players.length);
            this.players[nextPlayer].status = 'playing';
        }
        this.currentPlayer = nextPlayer;

        socket.emit('play-update', {
            currentSuit: this.currentSuit,
            currentPlayer: nextPlayer,
            players: this.players,
            inPlay: this.inPlay
        });

        if(this.inPlay.length === 3) {
            setTimeout(() => this.collectTrick(this, socket, endGame), 1200);
        }
    }

    shouldLoseNull(g) {
        return g.handDetails.trumpSuit === -2 && g.players[g.bidder].tricks.length > 0
    }

    shouldLoseSchwarz(g) {
        let defenseTricks = 0;
        for(let i = 0; i < g.players.length; i++) {
            if(g.players[i] !== g.bidder) {
                defenseTricks += g.players[i].tricks.length;
            }
        }
        return defenseTricks > 0 && g.handDetails.schwarzAnnounced;
    }

    collectTrick(g, socket, endGame) {
        
        // index of winning card in trick array
        let winningIndex = getHighestCardIndex(
            g.inPlay.map(i => i.card), 
            g.currentSuit, 
            g.handDetails.trumpSuit
        );
        
        let winner = g.inPlay[winningIndex].id;

        g.players[winner].tricks.push([...g.inPlay]);
        g.lastTrick = [...g.inPlay];
        g.inPlay = [];
        
        g.currentPlayer = winner;
        g.players[winner].status = 'playing';

        socket.emit('collect-trick', {
            players: g.players,
            inPlay: [],
            currentPlayer: winner,
            lastTrick: g.lastTrick
        });

        if(g.players[g.bidder].cards.length === 0 || this.shouldLoseNull(g) || this.shouldLoseSchwarz(g)) {

            g.status = 'results';
            g.isComplete = g.handNumber === g.totalHands;
            g.calcCardPoints();
            g.results = g.getHandResults();

            if(g.results.won) {
                g.players[g.bidder].wins++;
            } else {
                g.players[g.bidder].losses++;
            }

            g.players.forEach((p, ind) => {
                p.score += g.results.scoreDiffs[ind];
                p.status = 'waitingForNext';
            });

            socket.emit('end-hand', {
                players: g.players,
                handDetails: g.handDetails,
                results: g.results
            });

            socket.emit('score-update', {
                pastHands: g.pastHands
            });

            if(g.results.isComplete) {
                endGame(g.tableId, g.totalHands, g.eventId, g.players);
            }
        }
    }

    calcCardPoints() {
        let defenseTricks = [];
        this.players.forEach(p => {
            if(p.index !== this.bidder) {
                defenseTricks.push(...p.tricks);
            }
        });

        this.handDetails.playerPoints = cardTotal([...this.players[this.bidder].tricks, [{card: this.skat[0]}, {card: this.skat[1]}]]);
        this.handDetails.defensePoints = cardTotal(defenseTricks);

        if(this.handDetails.playerPoints >= 90 || (this.handDetails.defensePoints >= 90 && this.handDetails.trumpSuit !== -2)) {
            this.handDetails.schneider = true;
        } else {
            this.handDetails.schneider = false;
        }

        const schwarzTrickTotals = [0, 10];
        if(schwarzTrickTotals.includes(this.players[this.bidder].tricks.length) && this.handDetails.trumpSuit !== -2) {
            this.handDetails.schwarz = true;
        } else {
            this.handDetails.schwarz = false;
        }
    }

    getHandResults() {

        const needSchneider = this.handDetails.startValue() < utils.bids[this.bid] || this.handDetails.schneiderAnnounced;
        const needSchwarz = this.handDetails.startValue() + MULT_VALUES[this.handDetails.trumpSuit + 2] < utils.bids[this.handDetails.bid] || this.handDetails.schwarzAnnounced;

        let wonGame;
        if(this.handDetails.trumpSuit !== -2) {
            if(!needSchneider && !needSchwarz) {
                wonGame = this.handDetails.playerPoints > 60;
            } else if(needSchneider && !needSchwarz) {
                wonGame = this.handDetails.playerPoints >= 90;
            } else {
                wonGame = this.players[this.bidder].tricks.length === 10;
            }
        } else {
            wonGame = this.players[this.bidder].tricks.length === 0;
        }

        const isOverbid = this.handDetails.endValue() < utils.bids[this.bid];

        let overbidValue = 0, overbidMultiplers = 0;
        if(isOverbid) {
            overbidValue = this.handDetails.endValue();
            while(overbidValue < utils.bids[this.bid]) {
                overbidValue += MULT_VALUES[this.handDetails.trumpSuit + 2];
                overbidMultiplers++;
            }
        }

        this.pastHands.push({
            player: this.bidder,
            won: wonGame,
            trumpSuit: this.handDetails.trumpSuit,
            matadors: this.handDetails.matadors,
            multipliers: this.handDetails.multiplierMap(),
            value: this.handDetails.endValue(),
            overbid: isOverbid,
            overbidValue: overbidValue
        });

        return {
            won: wonGame,
            scoreDiffs: this.players.map(p => scoreDiff(wonGame, p.index === this.bidder, isOverbid ? overbidValue : this.handDetails.endValue(), this.players.length)),
            needSchneider: needSchneider,
            needSchwarz: needSchwarz,
            overbid: isOverbid,
            overbidValue: overbidValue,
            overbidMultipliers: overbidMultiplers,
            startValue: this.handDetails.startValue(),
            endValue: this.handDetails.endValue(),
            multipliers: this.handDetails.multipliers(),
            multiplierMap: this.handDetails.multiplierMap(),
            isComplete: this.handNumber === this.totalHands
        };
    }
}

module.exports['Game'] = Game;