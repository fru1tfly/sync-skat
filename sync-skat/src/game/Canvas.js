import { useContext, useEffect, useRef } from "react";
import { GameStateContext, GameStateUpdateContext } from "../GameStateContext";
import { cards, positionCardInHand, positionCardInPlay, positionCardInTrick, positionCardInSkat } from "./gameUtils";
import { canPlayCard } from "./cardUtils";
import { socket } from "../components/socket";
import { getCardWidth } from "../components/utils";

let canvas;
let ctx;
let canvasState = null;
let prevTime;
let pIndex;
let loaded = false;

const MAX_SELECTED_CARDS = 2;

const render = (time) => {
    let w = canvas.width;
    let h = canvas.height;

    let dt = time - prevTime;
    prevTime = time;
    ctx.fillStyle = '#607b75';
    ctx.fillRect(0, 0, w, h);

    if(canvasState && loaded) {
        for(let card of canvasState.deck) {
            cards[card].draw(ctx, dt);
        }

        if(canvasState.status === 'dealing') {
            return;
        }

        
        let firstCard = true;

        for(let card of canvasState.skat) {
            positionCardInSkat(canvasState, card, w, h, firstCard);
            firstCard = false;
            cards[card].draw(ctx, dt);
        }

        for(let p of canvasState.players) {
            p.tricks.forEach((t) => {
                t.forEach((c) => {
                    positionCardInTrick(c.card, p.screenPos, w, h);
                    cards[c.card].draw(ctx, dt);
                });
            });
        }

        for(let inPlay of canvasState.inPlay) {
            positionCardInPlay(inPlay.card, canvasState.players[inPlay.id].screenPos, w, h);
            cards[inPlay.card].draw(ctx, dt);
        }

        for(let p of canvasState.players) {
            if(!canvasState.handOver && p.index !== pIndex) {
                p.cards.forEach((card, ind) => {
                    positionCardInHand(p.screenPos, p.cards, ind, w, h, p.handOpen);
                    cards[card].draw(ctx, dt);
                });
            }
        }

        if(!canvasState.handOver) {
            canvasState.players[pIndex].cards.forEach((card, ind) => {
                positionCardInHand(canvasState.players[pIndex].screenPos, canvasState.players[pIndex].cards, ind, w, h);
                cards[card].draw(ctx, dt)
            });
        }
    }
    requestAnimationFrame(render);
};

const canSelectCard = (game) => {
    return  game.players[pIndex].screenPos === 0 && 
            game.players[pIndex].status === 'declare' &&
            game.players[pIndex].cards.length === 12;
}

const canvasClick = (e, game, update, selected, setSelected, pIndex) => {
    if(!game || !game.players) return;

    const canvasOffset = {
        x : window.innerWidth > window.innerHeight ? 200 : 0,
        y : window.innerWidth <= window.innerHeight ? 200 : 0
    };

    let playerCards = game.players[pIndex].cards.map(c => cards[c]);
	let mousePoint = { x: (e.clientX - canvasOffset.x) * window.devicePixelRatio, y: (e.clientY - canvasOffset.y) * window.devicePixelRatio};
	let selectedIndex = -1;
    let cardWidth = getCardWidth(canvas.width, canvas.height);
    let cardHeight = cardWidth * 1.6;

    for(let i = 0; i < playerCards.length; i++) {
        if (Math.abs(playerCards[i].position.x - mousePoint.x) < cardWidth / 2 * playerCards[i].position.scale && 
            Math.abs(playerCards[i].position.y - mousePoint.y) < (cardHeight / 2 * playerCards[i].position.scale)) {
            
            selectedIndex = i;
        }
    }

	if(selectedIndex !== -1 && game.players[pIndex].status === 'playing' &&
        (game.inPlay.length === 0 ||
        canPlayCard(game.players[pIndex], selectedIndex, game.currentSuit, game.handDetails.trumpSuit))) {
        socket.emit('play-card', game.players[pIndex].cards[selectedIndex]);
	}

    if(selectedIndex !== -1 && canSelectCard(game)) {
        let selectedCard = cards[game.players[pIndex].cards[selectedIndex]];
        selectedCard.selected = !selectedCard.selected;
        if(selectedCard.selected) {
            if(selected + 1 > MAX_SELECTED_CARDS) {
                selectedCard.selected = false;
            } else {
                setSelected(selected + 1);
            }
        } else {
            setSelected(selected - 1);
        }
    }
}

const Canvas = (props) => {
    const { playerIndex, windowSize, cardsSelected, setCardsSelected } = props;

    const canvasRef = useRef(null);
    const game = useContext(GameStateContext);
    const setGame = useContext(GameStateUpdateContext);

    useEffect(() => {

        let anim;

        const canvasInput = (e) => {
            canvasClick(e, 
                canvasState, 
                setGame, 
                cardsSelected, 
                setCardsSelected, 
                playerIndex
            );
        }

        canvas = canvasRef.current;
        ctx = canvas.getContext('2d');
        pIndex = playerIndex;
        canvas.addEventListener('mousedown', canvasInput);
        anim = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(anim);
            canvas.removeEventListener('mousedown', canvasInput)
        }
    }, [playerIndex, cardsSelected]);

    useEffect(() => {
        let scale = window.devicePixelRatio;

        canvas.width = windowSize.x * scale;
        canvas.height = windowSize.y * scale;
        canvas.style.width = windowSize.x + 'px';
        canvas.style.height = windowSize.y + 'px';

        canvas.style.right = 0;
        canvas.style.bottom = 0;
    }, [windowSize]);

    useEffect(() => {
        if(game) {
            loaded = game.loaded;
            canvasState = {...game};
        }
    }, [game]);

    return (<canvas className="game-canvas" ref={canvasRef} />);
}

export default Canvas;