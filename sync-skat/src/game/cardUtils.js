import { cards } from './gameUtils';

export const suitMap = {
	'diamonds' : 0,
	'hearts' : 1,
	'spades' : 2,
	'clubs' : 3,
	'grand' : -1,
	'null' : -2
};

// TEMP
export const bids = [
    18, 20, 22, 23, 24,
    27, 30, 33, 35, 36,
    40, 44, 45, 46, 48, 
    50, 54, 55, 59, 60,
    63, 66, 70, 72, 77,
    80, 81, 84, 88, 90,
    96, 99, 100, 108, 110, 
    117, 120, 121, 126, 130, 
    132, 135, 140, 143, 144,
    150, 153, 154, 156, 160, 
    162, 165, 168, 170, 176,
    180, 187, 192, 198, 204,
    216, 240, 264
];

export function sortHand(hand, trumpSuit) {


    let newHand = hand.map(c => cards[c]);

	// sort by rank
	newHand.sort((a, b) => {
		if(trumpSuit === suitMap['null']) {
			if(a.rank === 6) {
				a.rank = 2.5;
			}
			if(b.rank === 6) {
				b.rank = 2.5;
			}
		}
		if(a.rank > b.rank) {
			if(a.rank === 2.5) {
				a.rank = 6;
			}
			if(b.rank === 2.5) {
				b.rank = 6;
			}
			return -1;
		}
		if(a.rank < b.rank) {
			if(a.rank === 2.5) {
				a.rank = 6;
			}
			if(b.rank === 2.5) {
				b.rank = 6;
			}
			return 1;
		}
		if(a.rank === 2.5) {
			a.rank = 6;
		}
		if(b.rank === 2.5) {
			b.rank = 6;
		}
		return 0;
	});
	
	// sort by suit
	newHand.sort((a, b) => {
		if(a.suit > b.suit) {
			return -1;
		}
		if(a.suit < b.suit) {
			return 1;
		}
		return 0;
	});

	// put trump suit first
	newHand.sort((a, b) => {
		if(a.suit === trumpSuit && b.suit !== trumpSuit) {
			return -1;
		}
		if(a.suit !== trumpSuit && b.suit === trumpSuit) {
			return 1;
		}
		return 0;
	});

	// put jacks at front
	if(trumpSuit !== suitMap['null']) {
		newHand.sort((a, b) => {
			if((a.rank === 3 && b.rank !== 3) || (a.rank === 3 && b.rank === 3 && a.suit > b.suit)) {
				return -1;
			}
			if((a.rank !== 3 && b.rank === 3) || (a.rank === 3 && b.rank === 3 && a.suit < b.suit)) {
				return 1;
			}
			return 0;
		});
	}

    return newHand.map(c => c.getKey());
}

export function playCard(player, cardIndex, screenPos, w, h) {
	let card = player.cards.splice(cardIndex, 1)[0];
	let destination = player.getPlayPosition(w, h);
	card.position.x = destination.x;
	card.position.y = destination.y;
	card.position.rotation += Math.random() * 0.9 - 0.45;
	card.position.scale = 0.8;
    card.screenPos = screenPos;
	return card;
}

export function canPlayCard(player, ind, currentSuit, trumpSuit) {

	let card = cards[player.cards[ind]];
	let isNull = trumpSuit === suitMap['null'];
	let isJack = !isNull && card.rank === 3;

	let matchingCards = player.cards.filter((c) => {
		let isJackInner = cards[c].rank === 3 && !isNull;
		if(currentSuit === trumpSuit) {
			return cards[c].suit === currentSuit || isJackInner;
		} else {
			return cards[c].suit === currentSuit && !isJackInner;
		}
	});

	let isSuit = card.suit === currentSuit;
	if(trumpSuit !== suitMap['null']) {
		isSuit = (isSuit && !isJack) || (isJack && currentSuit === trumpSuit);
	}
	let isVoid = matchingCards.length === 0;
	return isSuit || isVoid;
}

export function getBaseMultiplier(hand, trumpSuit) {

    let value = 0;
    let suitPtr = 3;
    let rankPtr = 7;

	let handCards = hand.map(c => cards[c]);

    if(trumpSuit === -2) {
        return 1;
    }

    while(value < 4 && handCards.filter((c) => c.suit === suitPtr && c.rank === 3).length === 1) {
        value++;
        suitPtr--;
    }

    if(value === 0) {
        while(value > -4 && handCards.filter((c) => c.suit === suitPtr && c.rank === 3).length === 0) {
            value--;
            suitPtr--;
        }
    }

    if(Math.abs(value) === 4 && trumpSuit !== -1) {
        suitPtr = trumpSuit;
        if(value < 0) {
            while(value > -11 && handCards.filter((c) => c.suit === suitPtr && c.rank === rankPtr).length === 0) {
                value--;
                rankPtr--;
            }
        } else {
            while(value < 11 && handCards.filter((c) => c.suit === suitPtr && c.rank === rankPtr).length === 1) {
                value++;
                rankPtr--;
            }
        }
    }

    return value;
}

export function resultsCardOffset(screenPos, h) {
    switch(screenPos) {
        case 0:
            return {x: 0, y: h / 21};
        case 1:
            return {x: -h / 21, y: 0};
        case 2:
            return {x: 0, y: -h / 21};
        case 3:
            return {x: h / 21, y: 0};
        default:
            return {x: 0, y: 0};
    }
}

