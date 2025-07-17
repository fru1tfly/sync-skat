import { useState, useContext } from 'react';
import { GameStateContext, GameStateUpdateContext } from '../GameStateContext';
import { getBaseMultiplier, bids, sortHand } from './cardUtils';
import { handDescription, cards } from './gameUtils';
import GameTypeButton from '../components/GameTypeButton';
import MultiplierButton from '../components/MultiplierButton';
import { Hand } from './Hand';
import { socket } from "../components/socket";
import { GAMES } from '../components/utils';

import "../styles/declare.css";

export const DeclareMenu = (props) => {
    const { pIndex, playingHand, cardsSelected } = props;
    const [gameType, setGameType] = useState(null);
    const gameState = useContext(GameStateContext);
    const updateGameState = useContext(GameStateUpdateContext);
    const [multipliers, setMultipliers] = useState([false, false, false]);
    const [game, setGame] = useState(new Hand(gameType, getBaseMultiplier(gameState.players[pIndex].cards, gameType)));

    const updateMultiplers = (mult) => {
        game.schneiderAnnounced = mult[0];
        game.schwarzAnnounced = mult[1];
        game.ouvert = mult[2];
        setMultipliers(mult);
    }

    const canSelect = (index, game) => {
        return (playingHand && game !== -2) || (index === 2 && game === -2);
    };

    const canAnnounce = (cardsSelected === 2 || playingHand) && gameType !== null;

    const selectGameType = (gameIndex) => {
        setGameType(gameIndex);

        let tempMult = [...multipliers];
        for(let i = 0; i < tempMult.length; i++) {
            if(tempMult[i] && !canSelect(i, gameIndex)) {
                tempMult[i] = false;
            }
        }

        if(gameIndex !== -2 && tempMult[2]) {
            tempMult[0] = true;
            tempMult[1] = true;
        }else if (tempMult[2]) {
            tempMult[0] = false;
            tempMult[1] = false;
        }

        updateMultiplers(tempMult);

        const players = gameState.players.map((p, ind) => {
            return {
                ...p,
                cards: ind === pIndex ? sortHand(gameState.players[ind].cards, gameIndex) : gameState.players[ind].cards
            };
        });

        setGame({
            ...game, 
            trumpSuit: gameIndex,
            matadors: getBaseMultiplier(gameState.players[pIndex].cards, gameIndex),
            hand: playingHand
        });
        updateGameState({...gameState, players: players});
    };

    const selectToggle = (index) => {
        let tempMult = [...multipliers];
        if(tempMult[index]) {
            tempMult[index] = false;
            for(let i = index; i < multipliers.length; i++) {
                tempMult[i] = false;
            }
        } else {
            tempMult[index] = true;
            if(!(index === 2 && gameType === -2)) {
                for(let i = index; i >= 0; i--) {
                    tempMult[i] = true;
                }
            }
        }

        updateMultiplers(tempMult);
    };

    const handleAnnounce = (e) => {
        let skat = [];

        // pull the 2 selected cards out of the hand and add them to the skat
        if(cardsSelected === 2) {
            skat = gameState.players[pIndex].cards.filter((c) => cards[c].selected);

            for(let card of skat) {
                cards[card].selected = false;
            }
        }

        let game = new Hand();
        game.matadors = getBaseMultiplier([...gameState.players[pIndex].cards, ...gameState.skat], gameType);
        game.trumpSuit = gameType;
        game.hand = playingHand;
        game.schneiderAnnounced = multipliers[0];
        game.schwarzAnnounced = multipliers[1];
        game.ouvert = multipliers[2];

        socket.emit('announce', {
            skat: skat,
            pIndex: pIndex,
            handDetails: {...game}
        });
    };


    return (
        <div className="declare-menu border-m round-xl regular">
			<div className="game-icon-row">
                {GAMES.map(g => <GameTypeButton
                    {...g}
                    gameIndex={g.index}
                    selected={gameType === g.index}
                    select={selectGameType}
                />)}
			</div>

            <div className="multipliers-row">
                <MultiplierButton index={0} label="Schneider" disabled={!canSelect(0, gameType)} selected={multipliers[0]}  select={selectToggle} />
                <MultiplierButton index={1} label="Schwarz" disabled={!canSelect(1, gameType)} selected={multipliers[1]} select={selectToggle}  />
                <MultiplierButton index={2} label="Ouvert" disabled={!canSelect(2, gameType)} selected={multipliers[2]} select={selectToggle}  />
            </div>

            <div className="declare-btn-row">
                <div className={`btn-primary btn-group-btn border-s round-l semi-bold title ${canAnnounce ? 'selected' : ''}`}
                    onClick={() => { if(canAnnounce) handleAnnounce() }}
                >
                    {gameType !== null && `${handDescription(game)} at ${bids[gameState.bid]}`}
                    {gameType === null && `Select a Game`}
                </div>
            </div>

		</div>
    );
}

export default DeclareMenu;