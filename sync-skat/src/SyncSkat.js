import { useRef, useReducer, useEffect, useState, useContext } from "react";

import * as cardUtils from "./game/cardUtils";

import Canvas from "./game/Canvas";
import { GameMenus } from './game/GameMenus';
import { UserContext } from "./UserContext";
import GameResults from "./game/GameResults";
import { socket } from "./components/socket";
import { cards, positionCardInHand, loopbackIndex, positionCardInPlay, positionCardInTrick, positionCardInSkat } from "./game/gameUtils";
import { GameStateContext, GameStateUpdateContext } from './GameStateContext';
import { getCardWidth } from "./components/utils";
import { useNavigate } from 'react-router-dom';
import FullscreenButton from './components/FullscreenButton';
import Toolbar from "./Toolbar";

let playerIndex = 0;

const SyncSkat = () => {
	
	const nav = useNavigate();

	const getMaxSlots = () => {
		if(window.innerWidth > window.innerHeight) {
			return Math.max(Math.floor(window.innerHeight / 190) - 1, 1);
		} else {
			return Math.max(Math.floor(window.innerWidth / 190) - 1, 1);
		}
	}
	
	// collection of server-side data for all players
	const [game, setGame] = useState();
	const [results, setResults] = useState();
	const gameRef = useRef(game);
	const [maxToolbarSlots, setMaxToolbarSlots] = useState(getMaxSlots());

	const userInfo = useContext(UserContext);
	const [windowSize, setWindowSize] = useState((window.innerWidth > window.innerHeight ? {x: window.innerWidth - 200, y: window.innerHeight} : {x: window.innerWidth, y: window.innerHeight - 200}));
	const [cardsSelected, setCardsSelected] = useState(0);

	const updateGame = (newState) => {
		setGame(newState);
		gameRef.current = newState;
	}

	const loadGame = (game) => {
		playerIndex = game.players.findIndex(p => p.name === userInfo.username);

		const players = [...game.players];
		for(let i = 0; i < players.length; i++) {
			let offsetIndex = loopbackIndex(i, -playerIndex, players.length);
			players[i].screenPos = players.length === 3 && offsetIndex === 2 ? 3 : offsetIndex;
			players[i].cards = cardUtils.sortHand(players[i].cards, game.handDetails.trumpSuit);
			players[i].cards.forEach((card, ind) => {
				positionCardInHand(players[i].screenPos, players[i].cards, ind, windowSize.x * window.devicePixelRatio, windowSize.y * window.devicePixelRatio);
				cards[card].oldPos = {...cards[card].position};
			});

			players[i].tricks.forEach(t => {
				t.forEach((c) => {
					positionCardInTrick(c.card, players[i].screenPos, windowSize.x * window.devicePixelRatio, windowSize.y * window.devicePixelRatio);
					cards[c.card].oldPos = {...cards[c.card].position};
				})
			});
		}

		for(let i = 0; i < game.inPlay.length; i++) {
			positionCardInPlay(game.inPlay[i].card, game.players[game.inPlay[i].id].screenPos, windowSize.x * window.devicePixelRatio, windowSize.y * window.devicePixelRatio);
			cards[game.inPlay[i].card].oldPos = {...cards[game.inPlay[i].card].position};
		}

		for(let i = 0; i < game.skat.length; i++) {
			positionCardInSkat(game, game.skat[i], windowSize.x * window.devicePixelRatio, windowSize.y * window.devicePixelRatio, i === 0);
			cards[game.skat[i]].oldPos = {...cards[game.skat[i]].position};
		}

		// hide cards other than cards in play and in player's hand
		for(const [key, card] of Object.entries(cards)) {
			if (game.players[playerIndex].cards.findIndex(c => c === key) !== -1 || 
				game.inPlay.findIndex(c => c === key) !== -1) {
				
				card.hidden = false;
			} else {
				card.hidden = true;
			}
		}

		updateGame({...game, players: players, loaded: true});
		setResults(game.results);
	};

	const dealCards = (pIndex, deck, number) => {
		let cards = deck.splice(deck.length - number, number);

		const players = gameRef.current.players.map((p, ind) => {
			if(ind === pIndex) {
				return {
					...p,
					cards: [...p.cards, ...cards]
				};
			}
			return p;
		});

		updateGame({
			...gameRef.current,
			deck: deck,
			players: players
		});
	}

	const dealSkat = (deck) => {
		let cards = deck.splice(deck.length - 2, 2);
		updateGame({
			...gameRef.current,
			deck: deck,
			skat: cards       
    	});
	}

	const startHand = (data) => {
		console.log('start hand');
		const players = game.players.map((p, ind) => {
			return {
				...p,
				...data.players[ind],
				cards: [],
				tricks: []
			};
		});

		updateGame({...game, 
			deck: data.deck, 
			handNumber: data.handNumber,
			players: players,
			skat: [],
			inPlay: [],
			status: 'dealing',
			bid: -1
		});

		const w = getCardWidth(windowSize.x, windowSize.y);
		for(let i = 0; i < data.deck.length; i++) {
			cards[data.deck[i]].hidden = true;
			cards[data.deck[i]].moving = false;
			cards[data.deck[i]].oldPos = {x: -w, y: windowSize.y / 4, rotation: -0.4, scale: 0.7};
			cards[data.deck[i]].position = {x: windowSize.x / 2 * window.devicePixelRatio, y: (windowSize.y / 5 - (i * 0.33)) * window.devicePixelRatio, rotation: 0, scale: 0.6};
		}


		let startIndex = data.handNumber % gameRef.current.players.length;

		// dealing animation
		let initialOffset = 800; // time for deck to appear
		let dealGap = 800; // time between waves of cards
		let playerGap = 250; // time between players in a wave

		for(let i = 0; i < 3; i++) {
			setTimeout(() => dealCards(loopbackIndex(startIndex, i, gameRef.current.players.length), data.deck, 3), initialOffset + (playerGap * i));
		}

		setTimeout(() => dealSkat(data.deck), initialOffset + dealGap );

		for(let i = 0; i < 3; i++) {
			setTimeout(() => dealCards(loopbackIndex(startIndex, i, gameRef.current.players.length), data.deck, 4), initialOffset + dealGap * 1.6 + playerGap * i);
			setTimeout(() => dealCards(loopbackIndex(startIndex, i, gameRef.current.players.length), data.deck, 3), initialOffset + dealGap * 2.6 + playerGap * i);
		}

		setTimeout(() => {
			const newPlayers = gameRef.current.players.map((p, ind) => {
				return { ...p, cards: ind === playerIndex ? cardUtils.sortHand(p.cards, -1) : p.cards }
			});
			updateGame({ ...gameRef.current, players: newPlayers });
		}, initialOffset + dealGap * 4);
	}

	const startBids = (data) => {
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				status: ind === data.bidder ? 'bid' : p.status,
				position: data.players[ind].position
			};
		});

		updateGame({
			...gameRef.current, 
			bidder: data.bidder,
			listener: data.listener,
			players: players,
			status: 'bidding'
		});
	}

	const bidUpdate = (data) => {
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				status: data.players[ind].status,
				bid: data.players[ind].bid
			};
		});

		updateGame({
			...gameRef.current, 
			bid: data.bid,
			players: players
		});
	}

	const passUpdate = (data) => {
		if(!data.allPass) {
			const players = gameRef.current.players.map((p, ind) => {
				return {
					...p,
					status: data.players[ind].status,
					bidding: data.players[ind].bidding,
					passed: data.players[ind].passed
				};
			});

			updateGame({
				...gameRef.current, 
				players: players,
				bidder: data.bidder,
				listener: data.listener
			});
		} else {

			const players = gameRef.current.players.map((p, ind) => {
				return {
					...p,
					handOpen: true
				};
			});

			updateGame({
				...gameRef.current,
				players: players,
				status: 'results'
			});
	
			setResults(data);
		}
	}

	const pickupUpdate = (data) => {
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				status: data.players[ind].status,
				cards: ind === playerIndex ? cardUtils.sortHand(data.players[ind].cards) : data.players[ind].cards
			};
		});

		updateGame({
			...gameRef.current, 
			players: players,
			skat: []
		});
	}

	const handUpdate = (data) => {
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				status: data.players[ind].status
			};
		});

		updateGame({
			...gameRef.current, 
			players: players,
			handDetails: {...gameRef.current.handDetails, hand: true}
		});
	}

	const announceUpdate = (data) => {
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				status: data.players[ind].status,
				cards: cardUtils.sortHand(data.players[ind].cards, data.handDetails.trumpSuit),
				handOpen: data.players[ind].handOpen
			};
		});

		updateGame({
			...gameRef.current, 
			players: players,
			skat: data.skat,
			bidder: data.bidder,
			status: 'playing',
			currentPlayer: data.currentPlayer,
			handDetails: data.handDetails
		});

		setCardsSelected(0);
	}

	const playUpdate = (data) => {
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				status: data.players[ind].status,
				cards: cardUtils.sortHand(data.players[ind].cards, gameRef.current.handDetails.trumpSuit)
			};
		});

		updateGame({
			...gameRef.current, 
			players: players,
			currentPlayer: data.currentPlayer,
			currentSuit: data.currentSuit,
			inPlay: data.inPlay
		});
	}

	const collectTrick = (data) => {
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				status: data.players[ind].status,
				tricks: data.players[ind].tricks
			};
		});

		updateGame({
			...gameRef.current, 
			players: players,
			currentPlayer: data.currentPlayer,
			inPlay: data.inPlay,
			lastTrick: data.lastTrick
		});
	}

	const endHand = (data) => {
		
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				wins: data.players[ind].wins,
				losses: data.players[ind].losses,
				score: data.players[ind].score,
				status: data.players[ind].status,
				handOpen: true
			};
		});

		updateGame({
			...gameRef.current,
			players: players,
			handDetails: data.handDetails,
			status: 'results',
			inPlay: []
		});

		setResults(data.results);
	}

	const disconnected = (msg) => console.log(msg);

	const checkUserStatus = (data) => {
    }

	const statusUpdate = (data) => {
		const players = gameRef.current.players.map((p, ind) => {
			return {
				...p,
				status: data.players[ind].status
			};
		});

		updateGame({
			...gameRef.current,
			players: players,
			status: data.status
		});
	}

	const printEvent = (event) => console.log(event);

	useEffect(() => {
			if(userInfo) {
				socket.emit('get-game-data', userInfo.username);
				socket.emit('check-user-status');
			}

			socket.on('load-game', loadGame);
			socket.on('start-hand', startHand);
			socket.on('start-bids', startBids);
			socket.on('bid-update', bidUpdate);
			socket.on('pass-update', passUpdate);
			socket.on('pickup-update', pickupUpdate);
			socket.on('hand-update', handUpdate);
			socket.on('announce-update', announceUpdate);
			socket.on('play-update', playUpdate);
			socket.on('collect-trick', collectTrick);
			socket.on('end-hand', endHand);
			socket.on('disconnected', disconnected);
			socket.on('user-status', checkUserStatus);
			socket.on('status-update', statusUpdate);
			socket.onAny(printEvent);

			const sizeWindow = () => { 
				if(window.innerWidth > window.innerHeight) {
					setWindowSize({x: window.innerWidth - 200, y: window.innerHeight}); 
				} else {
					setWindowSize({x: window.innerWidth, y: window.innerHeight - 200}); 
				}
				
				setMaxToolbarSlots(getMaxSlots());
			}
			window.addEventListener('resize', sizeWindow);

			return () => {
				socket.off('load-game', loadGame);
				socket.off('start-hand', startHand);
				socket.off('start-bids', startBids);
				socket.off('bid-update', bidUpdate);
				socket.off('pass-update', passUpdate);
				socket.off('pickup-update', pickupUpdate);
				socket.off('hand-update', handUpdate);
				socket.off('announce-update', announceUpdate);
				socket.off('play-update', playUpdate);
				socket.off('collect-trick', collectTrick);
				socket.off('end-hand', endHand);
				socket.off('disconnected', disconnected);
				socket.off('user-status', checkUserStatus);
				socket.off('status-update', statusUpdate);
				socket.offAny(printEvent);

				window.removeEventListener('resize', sizeWindow);
			}
	}, [userInfo]);

	return (
		<GameStateContext.Provider value={game}>
			<GameStateUpdateContext.Provider value={updateGame}>
				<Canvas playerIndex={playerIndex} windowSize={windowSize} cardsSelected={cardsSelected} setCardsSelected={setCardsSelected}/>
				{game?.status !== 'results' && game?.players.length > 0 &&
					<GameMenus player={game?.players[playerIndex]} usr={playerIndex} size={windowSize} cardsSelected={cardsSelected}/>
				}
				{game?.status === 'results' && 
					<GameResults game={game.handDetails} results={results} pIndex={playerIndex}/>
				}
				<Toolbar pIndex={playerIndex} maxSlots={maxToolbarSlots} />
				<FullscreenButton />
				<div className="hand-counter">{game?.handNumber}/{game?.totalHands}</div>
			</GameStateUpdateContext.Provider>
		</GameStateContext.Provider>
	);
}

export default SyncSkat;