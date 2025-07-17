import { useContext, useEffect, useState } from 'react';

import { bids } from './cardUtils';
import { socket } from "../components/socket";
import DeclareMenu from './DeclareMenu';
import { GameStateContext } from '../GameStateContext';
import { getCardWidth } from '../components/utils';
import { cards } from './gameUtils';

import "../styles/player.css";

export const GameMenus = (props) => {
    const { player, size, cardsSelected } = props;

    const gameState = useContext(GameStateContext);
    const [nextBid, setNextBid] = useState(0);
    const [playingHand, setPlayingHand] = useState(false);

    useEffect(() => {
        setNextBid(gameState.bid + 1);
    }, [gameState]);

    const bidStatus = () => {
        let displayText = '';
        if(player.bid !== -1) {
            displayText += bids[player.bid];
        }
        if(player.passed) {
            if(displayText !== '') {
                displayText += ' | Pass';
            } else {
                displayText = 'Pass';
            }
        }
        return displayText;
    }

    const handleBidIncrease = () => {
        let newBid = nextBid + 1;
        if(newBid === bids.length) {
            newBid--;
        }
        setNextBid(newBid);
    }

    const handleBidDecrease = () => {
        let newBid = nextBid - 1;
        if(newBid === gameState.bid) {
            newBid++;
        }
        setNextBid(newBid);
    }

    const handlePass = () => {
        socket.emit('pass', { 
            pIndex: player.index, 
            position: player.position 
        });
    }

    const handlePickup = () => {
        setPlayingHand(false);
        socket.emit('pickup', player.index);
    }

    const handleHand = () => {
        setPlayingHand(true);
        socket.emit('handGame', player.index);
    }

    const bidText = () => {
        if(player.bid === -1) {
            return (<div className="bid-menu-text"><span>It's Your Bid</span></div>);
        } else {
            return (
                <div className="bid-menu-text">
                    <div className="player-image-container circle">
                        <img alt="Profile Pic" src={gameState.players[gameState.listener].img} width="100%" height="100%"/>
                    </div>
                    <span>{gameState.players[gameState.listener].name} accepts</span>
                    <div className="accept-bid-value border-s round-m">{bids[gameState.bid]}</div>
                </div>
            );
        } 
    }

    const BidMenu = () => {
        let innerContent = '';
        if(player?.status === 'bid') {
            innerContent = (<>
                {bidText()}
                <div className="flex10">
                    <div className="bid-input-container">
                        <div className="bid-adjust-button border-s" onClick={handleBidDecrease}><i className="fa fa-solid fa-minus"></i></div>
                        <div className="bid-input border-s round-m">{bids[nextBid]}</div>
                        <div className="bid-adjust-button border-s" onClick={handleBidIncrease}><i className="fa fa-solid fa-plus"></i></div>
                    </div>
                    <div className="bid-action-btn border-s round-m bid-btn" onClick={() => socket.emit('bid', nextBid)}>
                        Bid
                    </div>
                    <div className="bid-action-btn border-s round-m pass-btn" onClick={handlePass}>
                        Pass
                    </div>
                </div>
            </>);
        } else if(player?.status === 'pickup') {
            innerContent = (
                <div className="flex10">
                    <div className="bid-action-btn border-s round-m bid-btn" onClick={handlePickup}>
                        Pick Up
                    </div>
                    <div className="bid-action-btn border-s round-m pass-btn" onClick={handleHand}>
                        Play Hand
                    </div>
                </div>
            );
        } else if(player?.status === 'accept') {
            innerContent = (<>
                <div className="bid-menu-text">
                    <div className="player-image-container circle">
                        <img alt="Profile Pic" src={gameState.players[gameState.bidder].img} width="100%" height="100%"/>
                    </div>
                    <span>{gameState.players[gameState.bidder].name} bid</span>
                    <div className="accept-bid-value border-s round-l">{bids[gameState.bid]}</div>
                </div>
                <div className="flex10">
                    <div className="bid-action-btn border-s round-m bid-btn" onClick={() => socket.emit('accept')}>
                        Accept
                    </div>
                    <div className="bid-action-btn border-s round-m pass-btn" onClick={handlePass}>
                        Pass
                    </div>
                </div>
            </>);
        } else if(player?.status === 'playorpass') {
            innerContent = (
                <div className="flex10">
                    <div className="bid-action-btn border-s round-m bid-btn" onClick={() => socket.emit('fhPlay', player.index)}>
                        Play Game
                    </div>
                    <div className="bid-action-btn border-s round-m pass-btn" onClick={handlePass}>
                        Pass
                    </div>
                </div>
            );
        } else {
            return null;
        }
        return (
            <div className="bid-menu border-m round-xl">
                {innerContent}
            </div>
        );
    }

    return (
        <>
            <BidMenu />
            {player?.screenPos === 0 && player?.status === 'declare' && 
                <DeclareMenu pIndex={player.index} playingHand={playingHand} cardsSelected={cardsSelected}/>
            }
        </>
    );
}