import { getCardWidth } from '../components/utils';
import Card from './Card';

let getPillWidth = () => window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(max-height: 600px)').matches ? 130 : 240;
const getPillHeight = () => window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(max-height: 600px)').matches ? 139 : 84;

export const MULT_VALUES = [23, 24, 9, 10, 11, 12];

// build deck
export const cards = {};
for(let suit = 0; suit < 4; suit++) {
    for(let rank = 0; rank < 8; rank++) {
        cards[`${suit}${rank}`] = new Card(suit, rank);
    }
}

export function loopbackIndex(ind, delta, length) {
	let result = ind + delta;
	if(result >= length) {
		return result - length;
	}
	if(result < 0) {
		return result + length;
	}
	return result;
}


export function gameName(gameType) {
	switch(gameType) {
		case -2:
			return 'Null';
		case -1:
			return 'Grand';
		case 0: 
			return 'Diamonds';
		case 1:
			return 'Hearts';
		case 2:
			return 'Spades';
		case 3:
			return 'Clubs';
		default:
			throw Error('unknown game type');
	}
}

export function handDescription(game) {

	let matadors = `${game.trumpSuit !== -2 ? (game.matadors > 0 ? 'with' : 'against') : ''} ${game.trumpSuit !== -2 ? Math.abs(game.matadors) : ''}`
	let schneider = `${(game.schneider || game.schneiderAnnounced) && !game.schwarzAnnounced ? 'Schneider' : ''}${game.schneiderAnnounced && !game.schwarzAnnounced ? ' (Announced)' : ''}`;
	let schwarz = `${(game.schwarz || game.schwarzAnnounced) && !game.ouvert ? 'Schwarz' : ''}${game.schwarzAnnounced && !game.ouvert ? ' (Announced)' : ''}`;
	let ouvert = `${game.ouvert ? 'Ouvert' : ''}`;
	return `${gameName(game.trumpSuit)} ${game.hand && (!game.ouvert) ? 'Hand' : ''} ${matadors} ${schneider} ${schwarz} ${ouvert} ${game.trumpSuit === -2 && game.hand ? 'Hand' : ''}`;
};

export function getPillPosition(screenPos, w, h) {
	switch(screenPos) {
		case 0:
			return {x : w / 2 - getPillWidth() / 2, y: h - (getCardWidth(w * window.devicePixelRatio, h * window.devicePixelRatio) / window.devicePixelRatio) * 1.4 - getPillHeight()};
		case 1:
			return {x : -10, y: h / 2 - getPillHeight() / 2};
		case 2:
			return {x : w / 2  - getPillWidth() / 2, y: -10};
		case 3:
			return {x : w - getPillWidth() + 10, y: h / 2 - getPillHeight() / 2};
		default: 
			throw Error('unknown screen position');
	}
};

export function positionCardInHand(screenPos, pCards, i, w, h, open) {
	const cardW = getCardWidth(w, h);
	const cardH = cardW * 1.6;

	const isSplitY = w / window.devicePixelRatio < 650 && pCards.length > 5 && (open || screenPos === 0);
	const isSplitX = h / window.devicePixelRatio < 700 && pCards.length > 5 && (open || screenPos === 0);
	const isFirstHalf = i < pCards.length / 2;
	const firstHalfLength = Math.ceil(pCards.length / 2);
	const secondHalfLength = Math.floor(pCards.length / 2);

	switch(screenPos) {
		
		case 0:
			cards[pCards[i]].position.y = h - cardH / 6;
			// stack cards in 2 rows if screen is too narrow
			if(isSplitY) {
				cards[pCards[i]].position.x = w / 2 + (isFirstHalf ? (i - firstHalfLength / 2 + 0.5) : (i - firstHalfLength - secondHalfLength / 2 + 0.5) ) * cardW / 2.5;
				cards[pCards[i]].position.y += -(isFirstHalf ? cardH / 2.5 : 0) + (isFirstHalf ? Math.pow(Math.abs(i - firstHalfLength / 2 + 0.5), 1.24) : Math.pow(Math.abs(i - firstHalfLength - secondHalfLength / 2 + 0.5), 1.24)) * cardW / 55;
			} else {
				// 1 row of cards
				cards[pCards[i]].position.x = w / 2 + (i - pCards.length / 2 + 0.5) * cardW / 2.5;
				cards[pCards[i]].position.y += Math.pow(Math.abs(i - pCards.length / 2 + 0.5), 1.24) * cardW / 55;
			}
			// push cards to edge on smaller screens
			if((w / h > 1 && h / window.devicePixelRatio < 500) || (w / h < 1 && w / window.devicePixelRatio < 650)) {
				cards[pCards[i]].position.y += cardH / 6 + cardH / 10;
			}
			cards[pCards[i]].position.rotation = isSplitY ? (isFirstHalf ? (i - firstHalfLength / 2 + 0.5) : (i - firstHalfLength - secondHalfLength / 2 + 0.5) ) * 0.013 : (i - pCards.length / 2 + 0.5) * 0.013;
			cards[pCards[i]].position.scale = 1.1;
			cards[pCards[i]].hidden = false;
			break;
		case 1:
			
			cards[pCards[i]].position.x = 0;

			if(isSplitX) {
				cards[pCards[i]].position.x += (isFirstHalf ? cardH / 3.5 : -cardH / 18) - (isFirstHalf ? Math.pow(Math.abs(i - firstHalfLength / 2 + 0.5), 1.24) : Math.pow(Math.abs(i - firstHalfLength - secondHalfLength / 2 + 0.5), 1.24)) * cardW / 55;
				cards[pCards[i]].position.y = h / 2 + (isFirstHalf ? (i - firstHalfLength / 2 + 0.5) : (i - firstHalfLength - secondHalfLength / 2 + 0.5) ) * cardW / 3;
			} else {
				cards[pCards[i]].position.x -= Math.pow(Math.abs(i - pCards.length / 2 + 0.5), 1.24) * cardW / 55;
				cards[pCards[i]].position.y = h / 2 + (i - pCards.length / 2 + 0.5) * cardW / 3.5;
			}

			if((h / window.devicePixelRatio < 600) || (w / window.devicePixelRatio < 700)) {
				cards[pCards[i]].position.x -= cardH / 10;
			}

			cards[pCards[i]].position.rotation = Math.PI / 2 + (isSplitX ? (isFirstHalf ? (i - firstHalfLength / 2 + 0.5) : (i - firstHalfLength - secondHalfLength / 2 + 0.5) ) * 0.013 : (i - pCards.length / 2 + 0.5) * 0.013);
			cards[pCards[i]].position.scale = open ? 1 : 0.9;
			cards[pCards[i]].hidden = !open;
			break;
		case 2:
			cards[pCards[i]].position.y = 0;
			if(isSplitY) {
				cards[pCards[i]].position.x = w / 2 - (isFirstHalf ? (i - firstHalfLength / 2 + 0.5) : (i - firstHalfLength - secondHalfLength / 2 + 0.5) ) * cardW / 2.5;
				cards[pCards[i]].position.y += (isFirstHalf ? cardH / 3.25 : -cardH / 20) - (isFirstHalf ? Math.pow(Math.abs(i - firstHalfLength / 2 + 0.5), 1.24) : Math.pow(Math.abs(i - firstHalfLength - secondHalfLength / 2 + 0.5), 1.24)) * cardW / 55;
			} else {
				// 1 row of cards
				cards[pCards[i]].position.x = w / 2 - (i - pCards.length / 2 + 0.5) * cardW / 2.5;
				cards[pCards[i]].position.y -= Math.pow(Math.abs(i - pCards.length / 2 + 0.5), 1.24) * cardW / 55;
			}
			// push cards to edge on smaller screens
			if((w / h > 1.3 && h / window.devicePixelRatio < 500) || (w / h < 1 && w / window.devicePixelRatio < 650)) {
				cards[pCards[i]].position.y -= cardH / 15;
			}
			cards[pCards[i]].position.rotation = (isSplitY ? (isFirstHalf ? (i - firstHalfLength / 2 + 0.5) : (i - firstHalfLength - secondHalfLength / 2 + 0.5) ) * 0.013 : (i - pCards.length / 2 + 0.5) * 0.013);
			cards[pCards[i]].position.scale = 0.9;
			cards[pCards[i]].hidden = !open;
			cards[pCards[i]].inverted = open;
			break;
		case 3:
			cards[pCards[i]].position.x = w;

			if(isSplitX) {
				cards[pCards[i]].position.x -= (isFirstHalf ? cardH / 3.5 : -cardH / 18) - (isFirstHalf ? Math.pow(Math.abs(i - firstHalfLength / 2 + 0.5), 1.24) : Math.pow(Math.abs(i - firstHalfLength - secondHalfLength / 2 + 0.5), 1.24)) * cardW / 55;
				cards[pCards[i]].position.y = h / 2 - (isFirstHalf ? (i - firstHalfLength / 2 + 0.5) : (i - firstHalfLength - secondHalfLength / 2 + 0.5) ) * cardW / 3;
			} else {
				cards[pCards[i]].position.x += Math.pow(Math.abs(i - pCards.length / 2 + 0.5), 1.24) * cardW / 55;
				cards[pCards[i]].position.y = h / 2 - (i - pCards.length / 2 + 0.5) * cardW / 3.5;
			}

			if((h / window.devicePixelRatio < 600) || (w / window.devicePixelRatio < 700)) {
				cards[pCards[i]].position.x += cardH / 10;
			}

			cards[pCards[i]].position.rotation = 3 * Math.PI / 2 + (isSplitX ? (isFirstHalf ? (i - firstHalfLength / 2 + 0.5) : (i - firstHalfLength - secondHalfLength / 2 + 0.5) ) * 0.013 : (i - pCards.length / 2 + 0.5) * 0.013);
			cards[pCards[i]].position.scale = open ? 1 : 0.9;
			cards[pCards[i]].hidden = !open;
			break;
		default:
			break;
	}
}

export function positionCardInPlay(card, screenPos, w, h) {
    const destination = getPlayPosition(screenPos, w, h);
    cards[card].position.x = destination.x;
	cards[card].position.y = destination.y;
	cards[card].position.scale = 1;
	cards[card].position.rotation = getDestinationRotation(screenPos) + cards[card].randomRotation;
    cards[card].screenPos = screenPos;
    cards[card].hidden = false;
	cards[card].inverted = false;
}

export function positionCardInTrick(card, screenPos, w, h) {
    const destination = getPilePosition(screenPos, w, h);
    cards[card].position.x = destination.x;
	cards[card].position.y = destination.y;
	cards[card].position.scale = 0.7;
    cards[card].position.rotation = getDestinationRotation(screenPos) + cards[card].randomRotation;
    cards[card].screenPos = screenPos;
    cards[card].hidden = true;
}

export function positionCardInSkat(state, card, w, h, firstCard) {
	if(state.status === 'dealing' || state.status === 'bidding') {
		cards[card].position.x = w / 2 + (firstCard ? -w / 80 : w / 80);
		cards[card].position.y = h / 2;
		cards[card].hidden = true;
		cards[card].position.scale = 0.8;
		cards[card].position.rotation = firstCard ? -0.05 : 0.05;
	} else {
		let pos = getPilePosition(state.players[state.bidder].screenPos, w, h);

		cards[card].position.x = pos.x;
		cards[card].position.y = pos.y;
		cards[card].hidden = true;
		cards[card].position.scale = 0.7;
		cards[card].position.rotation = state.players[state.bidder].screenPos * Math.PI / 2 + (firstCard ? 0.05 : 0.05);
	}
}

export function getPlayPosition(screenPos, w, h) {
	switch(screenPos) {
		case 0: 
			return { x : w / 2, y : h / 2 + getCardWidth(w, h) / 4};
		case 1:
			return { x : w / 2 - getCardWidth(w, h) / 2, y : h / 2 };
		case 2:
			return { x : w / 2, y : h / 2 - getCardWidth(w, h) / 4};
		case 3:
			return { x : w / 2 + getCardWidth(w, h) / 2, y : h / 2 };
		default:
			return { x: 0, y: 0 };
	}
}

export function getPilePosition(screenPos, w, h) {
	const cardW = getCardWidth(w, h);
	const cardH = cardW * 1.6;
	switch(screenPos) {
		case 0: 
			return { x : w / 2, y : h + cardH };
		case 1:
			return { x : -cardH, y : h / 2 };
		case 2:
			return { x : w / 2, y : -cardH };
		case 3:
			return { x : w + cardH, y : h / 2 };
		default:
			return { x: 0, y: 0 };
	}
};

export function getDestinationRotation(screenPos) { 
    switch(screenPos) {
		case 0: 
			return 0;
		case 1:
			return Math.PI * 1.9;
		case 2:
			return 0;
		case 3:
			return Math.PI * 0.1;
		default:
			return 0;
	}
}