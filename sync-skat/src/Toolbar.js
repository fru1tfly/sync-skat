import { useState, useContext, useEffect, useRef } from 'react';
import { GameStateContext } from './GameStateContext';

import { socket } from "./components/socket";
import { bids } from './game/cardUtils';
import { loopbackIndex } from './game/gameUtils';
import Scoresheet from './game/Scoresheet'
import { GAMES } from './components/utils';
import MediaQuery from "react-responsive";
import Card from './game/Card';

import logo from './assets/header-logo.png';

// TODO: implement highlight animation ticking down
const ACTIVE_STATUSES = ['bid', 'accept', 'pickup', 'declare', 'playing', 'ready'];

const Toolbar = (props) => {
    const { pIndex, maxSlots } = props;
    const [fullScore, setFullScore] = useState(false);
    const [pastHands, setPastHands] = useState([]);

    const [toolbarCards, setToolbarCards] = useState(['table', 'score', 'last'].slice(0, maxSlots));

    const gameState = useContext(GameStateContext);
    const player = gameState?.players[pIndex];

    const scoreUpdate = (data) => {
        setPastHands(data.pastHands);
    }

    useEffect(() => {

        socket.emit('get-scores');

        socket.on('score-update', scoreUpdate);

        return () => {
            socket.off('score-update', scoreUpdate);
        }
    }, []);

    const getPosition = (player) => {
        switch(player.position) {
            case 0: 
                return 'FH';
            case 1:
                return 'MH';
            case 2:
                return 'RH';
            case 3: 
                return 'Dealer';
            default:
                return '';
        }
    };

    const getOrder = (p) => {
        if(gameState?.players.length === 4) {
            const offsetOrder = loopbackIndex(p.screenPos, 2, gameState?.players.length);
            if(offsetOrder === 3)
                return 2;
            if(offsetOrder === 2) 
                return 3;
            return offsetOrder;
        } else {
            if(p.screenPos === 0) {
                return 4;
            } else {
                return p.screenPos;
            }
        }
        
    }

    const getActionColor = (p) => {
        // dealing > highlighted during deal and grayed out during hand
        // bidding/accepting - 20 seconds
        // announcing - 30 seconds
        // playing a card - 30 seconds
        if(gameState.status !== 'dealing' && p.position === 3) {
            return 'rgba(0, 0, 0, 0.35)';
        }
        if(p.status === 'ready') {
            return '#a1dcb3';
        }
        return '#f59e2d';
    }

    const getActionHeight = (p) => {
        // dealing
        if (gameState && (p.position === 3 || (gameState.players.length === 3 && p.position === 2))) {
            if(gameState.status === 'dealing') {
                return 100;
            }
            if(gameState.players.length === 4) {
                return 100;
            }
        }
        if (gameState && ACTIVE_STATUSES.includes(p.status)) {
            return 100;
        }

        return 0;
    }

    const PlayerAvatar = (props) => {
        const { p } = props;
        return (
            <div style={{order: getOrder(p)}} className={((getOrder(p) < 2 && gameState?.players.length === 4) || (getOrder(p) < 4 && gameState?.players.length === 3)) ? "hud-player-overlay hud-top-row" : "hud-player-overlay"}>
                <div className="hud-player-meter" style={{backgroundColor: getActionColor(p), height: `${getActionHeight(p)}%`}}></div>
                <div className="hud-player-info">
                    <div className="hud-player-username">{p.name}</div>
                    <img alt={p.name} src={p.img} className="player-image-container circle" width="30px" height="30px"/>
                    <div className="hud-player-game-info">
                        {p.position !== 3 &&
                            <>
                                {p.position !== -1 && <div className="hud-player-position-pill round-l border-xs">{getPosition(p)}</div>}
                                <span>{p.passed ? 'Pass' : ''}</span>
                                <span>{p.bid > -1 ? bids[p.bid] : '--'}</span>
                            </>
                        }
                        {p.position === 3 && <span className="full-center">Dealer</span>}
                    </div>
                </div>
            </div>
        );
    }

    const TableCard = (props) => {
        return (
            <div className="toolbar-card border-m round-xl">
                <div className="table-leg" style={{top: 'calc(100% - 80px)', left: '12%'}}></div>
                <div className="table-leg table-leg-left" style={{top: 'calc(100% - 80px)', left: '78%'}}></div>
                <div className="table-card-table table-card-table-bottom"></div>
                <div className="table-card-table-middle"></div>
                <div className="table-card-table"></div>
                {gameState?.players.map((p, ind) => <PlayerAvatar p={p}/>)}
            </div>
        );
    }

    const game = GAMES.find(g => g.index === gameState?.handDetails.trumpSuit);

    const CardToggleButton = (props) => {
        const { cardName, iconName } = props;
        const selected = toolbarCards.includes(cardName) && !toolbarCards.includes(cardName, maxSlots);
        const disabled = false;
        const btnClass = "status-center-action-btn round-l border-m semi-bold " + (selected ? "status-center-action-btn-selected" : "") + (disabled ? "status-center-action-btn-disabled" : "");

        const handleCardToggle = () => {
            if(!selected && !disabled) {
                setToolbarCards([...(toolbarCards.slice(0, maxSlots - 1)), cardName]);
            } else if(selected) {
                setToolbarCards(toolbarCards.filter(c => c !== cardName).slice(0, maxSlots));
            }
        }

        return (
            <div className={btnClass} onClick={handleCardToggle}>
                <i className={`fa-solid ${iconName}`}></i>
            </div>
        );
    }

    const StatusCenter = (props) => {

        return (
            <div className="status-center">
                <div className="btn-primary round-l border-m status-game-pill center-flex">
                    {gameState?.status === 'playing' && 
                        <>
                            <img alt={gameState?.players[gameState?.bidder].name} src={gameState?.players[gameState?.bidder].img} className="border-xs circle" style={{flexShrink: 0}} width="26px" height="26px"/>
                            <span className="overflow-ellip">{gameState?.players[gameState?.bidder].name}</span>
                            {game?.iconType === 'image' && 
                                <img alt={game.label} src={game.iconContent} className="status-game-icon-img"/>
                            }
                            {game?.iconType === 'text' && 
                                <div className="status-game-icon-text">{game.iconContent}</div>
                            }
                        </>
                    }
                    {(gameState?.status === 'dealing' || gameState?.status === 'bidding') && 
                        <span className="overflow-ellip">Hand {gameState?.handNumber}</span>
                    }
                </div>
                <div className="status-center-action-row">
                    <CardToggleButton cardName="table" iconName="fa-users" />
                    <CardToggleButton cardName="score" iconName="fa-clipboard" />
                    <CardToggleButton cardName="last" iconName="fa-clock-rotate-left" />
                </div>
                {/* <div className="status-center-action-row">
                    <div className="status-center-action-btn round-l border-m semi-bold">
                    <i class="fa-solid fa-layer-group"></i>
                    </div>
                    <div className="status-center-action-btn round-l border-m semi-bold">
                        <i class="fa-solid fa-comments"></i>
                    </div>
                    <div className="status-center-action-btn round-l border-m semi-bold">
                        <i class="fa-solid fa-gear"></i>
                    </div>
                </div> */}
                <MediaQuery query="(min-height: 400px)">
                <div className="center-flex">
                    <img src={logo} className="footer-logo" alt="SyncSkat"></img>
                </div>
                </MediaQuery>
            </div>
        );
    }

    const ScoreCard = (props) => {
        return (
            <div className="toolbar-card border-m round-xl score-card">
                <div className="score-card-rows">
                    {gameState?.players.map(p => (
                        <div className="score-card-row border-xs round-l">
                            <img alt={p.name} src={p.img} className="border-xs circle" style={{flexShrink: 0}} width="26px" height="26px"/>
                            <div className="overflow-ellip">{p.name}</div>
                            <div>{p.score}</div>
                        </div>
                    ))}
                </div>
                <div className="score-card-actions">
                    <div className="toolbar-expand-btn border-xs round-l" onClick={() => setFullScore(true)}>
                        <i className="fa fa-solid fa-expand"></i> Full List
                    </div>
                    {/* <div className="toolbar-expand-btn border-xs circle">
                        <i className="fa fa-solid fa-scale-balanced"></i>
                    </div>
                    <div className="toolbar-expand-btn border-xs circle">
                        <i className="fa fa-solid fa-chart-simple"></i>
                    </div> */}
                </div>
            </div>
        );
    }

    const LastTrickCard = (props) => {

        const trickTotal = gameState?.players.reduce((total, p) => total + p.tricks.length, 0);
        const hasLastTrick = trickTotal !== undefined && trickTotal !== 0;
        const can = useRef();

        let cards = [];

        const CANVAS_SIZE = 190;

        const cardPositions = [
            { x: 0.48, y : 0.63 },
            { x : 0.23, y : 0.47 },
            { x : 0.48, y : 0.28 },
            { x : 0.73, y : 0.47 }
        ];
        const cardRotations = [0, Math.PI * 1.975, 0, Math.PI * 0.025];

        useEffect(() => {
            if(!can.current) return;

            let scale = window.devicePixelRatio;
            can.current.width = CANVAS_SIZE * scale;
            can.current.height = CANVAS_SIZE * scale;
            can.current.style.width = CANVAS_SIZE + 'px';
            can.current.style.height = CANVAS_SIZE + 'px';
    
        }, [can, window.devicePixelRatio]);

        useEffect(() => {
            if(hasLastTrick) {
                const ctx = can.current?.getContext('2d');
                for(let c of gameState.lastTrick) {
                    let card = new Card(c.card.charAt(0), c.card.charAt(1));
                    let cardPos = gameState.players[c.id].screenPos;
                    let scale = CANVAS_SIZE * window.devicePixelRatio;
    
                    
                    card.position.x = cardPositions[cardPos].x * scale;
                    card.position.y = cardPositions[cardPos].y * scale;
                    card.position.rotation = cardRotations[cardPos];

                    const dealer = gameState.players.find(p => p.position === 3);
                    if(dealer) {
                        if(dealer.screenPos === 1 || dealer.screenPos === 3) {
                            if(cardPos === 2) {
                                card.position.x += scale * (cardPositions[dealer.screenPos].x - cardPositions[cardPos].x) / 2;
                                card.position.rotation = cardRotations[dealer.screenPos];
                            }
                            if(dealer.screenPos === 1) {
                                card.position.x -= 10;
                                if(cardPos === 0) {
                                    card.position.rotation = (Math.PI * 2) - (cardRotations[3] / 4);
                                }
                            }
                            if(dealer.screenPos === 3) {
                                card.position.x += 12;
                                if(cardPos === 0) {
                                    card.position.rotation = cardRotations[3] / 4;
                                }
                            }
                        } else if (dealer.screenPos === 2) {
                            card.position.y -= 18;
                        } else if (dealer.screenPos === 0) {
                            card.position.y += 13;
                        }
                    } else {
                        card.position.y -= 18;
                    }

                    card.oldPos = {...card.position}; // prevent animation

                    card.draw(ctx, NaN, scale * 0.3);
                }
            }
        }, [hasLastTrick]);


        return (
            <div className="toolbar-card border-m round-xl last-trick-card">
                {!hasLastTrick && <>
                    <div className="big-icon">
                        <i className="fa fa-solid fa-hourglass-half"></i>
                    </div>
                </>}
                <canvas className="last-trick-canvas" width={`${CANVAS_SIZE}px`} height={`${CANVAS_SIZE}px`} ref={can} style={{display: hasLastTrick ? 'block' : 'none'}}></canvas>
            </div>
        );
    }

    const allCards = { table: <TableCard />, score: <ScoreCard />, last: <LastTrickCard />};
    const getCards = () => {
        let cardsRendered = 0;
        let output = [];

        for(let i = 0; i < toolbarCards.length; i++) {
            cardsRendered++;
            if(cardsRendered > maxSlots) {
                break;
            }

            output.push(allCards[toolbarCards[i]]);
        }
        return output;
    }

    return (
        <div className="toolbar">
            {getCards()}
            <MediaQuery query="(min-width: 400px) and (min-height: 400px)">
                <div className="toolbar-spacer"></div>
            </MediaQuery>
            <StatusCenter />
            {fullScore && 
                <Scoresheet game={gameState} closeScoresheet={() => setFullScore(false)} pastHands={pastHands} />
            }
        </div>
    );
}

export default Toolbar;