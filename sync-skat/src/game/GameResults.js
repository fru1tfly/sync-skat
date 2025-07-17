import { useState, useContext, useRef, useEffect } from 'react';

import { socket } from "../components/socket";
import { MULT_VALUES, handDescription, gameName } from './gameUtils';
import { GameStateContext, GameStateUpdateContext } from '../GameStateContext';
import { useNavigate } from 'react-router-dom';
import MediaQuery, { useMediaQuery } from "react-responsive";
import Card from './Card';

const GameResults = (props) => {
    const shouldAccordion = useMediaQuery({ query: '(max-width: 666px) and (max-height: 680px)' });

    const nav = useNavigate();
    const { game, results, pIndex } = props;
    const gameState = useContext(GameStateContext);
    const [viewMults, setViewMults] = useState(false);
    const [hitReady, setHitReady] = useState(false);
    const [scoreCollapsed, setScoreCollapsed] = useState(!results.allPass);
    const [playersCollapsed, setPlayersCollapsed] = useState(results.allPass);


    const playerPct = () => {
        return (game.playerPoints / 120) * 100;
    }

    const winLine = () => {
        if(!results.needSchneider && !results.needSchwarz) {
            return 50;
        } else if(!results.needSchwarz) {
            return 74;
        } else {
            return 100;
        }
    }

    const needExtraLine = () => {
        return  (game.playerPoints > 80 && !results.needSchneider) || 
                (game.defensePoints > 80 && game.trumpSuit !== -2);
    }

    const extraLine = () => {
        let extraLineColor = '#589d84';
        if(game.playerPoints > 80) {
            if(game.playerPoints < 90)
                extraLineColor = '#AA4A44';
            else
                extraLineColor = '#589d84';
            return [game.schwarz ? 100 : 74, extraLineColor];
        } else if(game.defensePoints > 80) {
            if(game.defensePoints < 90)
                extraLineColor = '#589d84';
            else
                extraLineColor = '#AA4A44';
            return [25, extraLineColor];
        } else {
            return 0;
        }
    }

    const barColor = () => {
        if(results.won) {
            return '#7dab94';
        } else {
            return '#814141';
        }
    }

    const pillClass = () => {
        if(results.allPass) {
            return 'game-result-pill border-s round-l neutral';
        } else if(results.won) {
            return 'game-result-pill border-s round-l';
        } else {
            return 'game-result-pill border-s round-l lose';
        }
    }

    const playerInfo = gameState.players.map((player, ind) => 
        <div className="player-info-results border-s round-l">
            <div className="player-image-container circle" style={{width: '30px', height: '30px'}}>
                <img alt="Profile Pic" src={player.img} width="100%" height="100%" />
            </div>
            <div className="player-results-username">
                {player.name}
            </div>
            <div className="player-info-record">
                {results.scoreDiffs && 
                    <span>{results.scoreDiffs[ind] > 0 ? `+${results.scoreDiffs[ind]}` : results.scoreDiffs[ind] === 0 ? '' : `${results.scoreDiffs[ind]}`}</span>
                }
                <span>{player.wins}-{player.losses}</span>
                <span className="player-info-record-score">{player.score}</span>
            </div>
        </div>
    );

    const gameBreakdown = () => {
        let rows = [];
        const baseGame = (
            <div className="game-breakdown-row game-breakdown-row-padded">
                <div className="game-breakdown-name">
                    {gameName(game.trumpSuit)} {game.trumpSuit === -2 ? ((game.ouvert ? ' Ouvert' : '' ) + (game.hand ? ' Hand' : '')) : ''}
                </div>
                <div className="game-breakdown-value">
                    {game.trumpSuit !== -2 ? MULT_VALUES[game.trumpSuit + 2] : results.endValue}
                </div>
            </div>
        );
        const matadors = (
            <div className="game-breakdown-row game-breakdown-row-subrow">
                <div className="game-breakdown-name">
                    {game.matadors > 0 ? 'With' : 'Without'}
                </div>
                <div className="game-breakdown-value">
                    {Math.abs(game.matadors)}
                </div>
            </div>
        );
        rows.push(matadors);

        const gameMultiplier = (
            <div className="game-breakdown-row game-breakdown-row-subrow">
                <div className="game-breakdown-name">
                    Game
                </div>
                <div className="game-breakdown-value">
                    1
                </div>
            </div>
        );
        rows.push(gameMultiplier);

        for (const [key, value] of Object.entries(results.multiplierMap)) {
            if(value) {
                rows.push(
                    <div className="game-breakdown-row game-breakdown-row-subrow">
                        <div className="game-breakdown-name">
                            {key}
                        </div>
                        <div className="game-breakdown-value">
                            1
                        </div>
                    </div>
                );
            }
        }

        const overbidMultiplier = (
            <div className="game-breakdown-row game-breakdown-row-subrow">
                <div className="game-breakdown-name">
                    Overbid
                </div>
                <div className="game-breakdown-value">
                    {results.overbidMultipliers}
                </div>
            </div>
        );

        if(results.overbid) {
            rows.push(overbidMultiplier);
        }

        return (<>
            <div className="game-breakdown-details">
                {baseGame}
                {game.trumpSuit !== -2 &&
                    <>
                        <div className="multipliers-subsection">
                            <div className="game-breakdown-row multipliers-header" onClick={() => setViewMults(!viewMults)}>
                                <div className="game-breakdown-name">
                                    Multipliers
                                    <i className={`fa fa-solid ${viewMults ? 'fa-caret-up' : 'fa-caret-down'}`}
                                    style={{marginLeft: '5px'}}></i>
                                </div>
                                <div className="game-breakdown-value">
                                    × {results.multipliers + Math.abs(game.matadors) + results.overbidMultipliers}
                                </div>
                            </div>
                            {viewMults && 
                                <div className="game-breakdown">
                                    {rows.map(row => row)}
                                </div>
                            }
                        </div>
                        <div className="game-breakdown-math-line"></div>
                        <div className="game-breakdown-row game-breakdown-row-padded">
                            <div className="game-breakdown-name">
                                Raw Score
                            </div>
                            <div className="game-breakdown-value">
                                {results.overbid ? results.overbidValue : results.endValue}
                            </div>
                        </div>
                    </>
                }

                {!results.won && 
                    <div className="game-breakdown-row game-breakdown-row-padded">
                        <div className="game-breakdown-name">
                            Lost Game
                        </div>
                        <div className="game-breakdown-value">
                            × -2
                        </div>
                    </div>
                }
                
                <div className="game-breakdown-row game-breakdown-row-padded">
                    <div className="game-breakdown-name">
                        Tournament Score
                    </div>
                    <div className="game-breakdown-value">
                        {results.won ? '+' : '-'} 50
                    </div>
                </div>
            </div>
            
            <div className="game-breakdown-math-line"></div>
            <div className="game-breakdown-row game-breakdown-row-padded game-breakdown-total">
                <div className="game-breakdown-name">
                    Total Points
                </div>
                <div className="game-breakdown-value">
                    {results.scoreDiffs[gameState.bidder]}
                </div>
            </div>
        </>);
    }

    const handleReadyForNext = () => {
        socket.emit('ready-for-next', pIndex);
        setHitReady(true);
    }

    const handleViewResults = () => {
        nav('/results/' + gameState.tableId);
    }

    const gameResults = () => (
        <>
            <div className={pillClass()}>
                {handDescription(game)}{results.overbid && <>(Overbid)</>}
            </div>
            {game.trumpSuit !== -2 && 
                <div className="score-bar-container">
                    <span className="score-bar-text">
                        {results.won ? (
                            <i class="fa fa-solid fa-trophy game-trophy"></i>
                        ) : (
                            <i class="game-trophy"></i>
                        )}
                        {game.playerPoints}
                    </span>
                    <div className="score-bar-outline border-s round-m">
                        <div className="score-bar-inner" style={{width: `${playerPct()}%`, backgroundColor: barColor()}}></div>
                        <div className="score-bar-win-line centered" style={{left: `${winLine()}%`}}></div>
                        {needExtraLine() && <div className="score-bar-win-line centered extra-line" style={{left: `${extraLine()[0]}%`, borderColor: extraLine()[1]}}></div>}
                    </div>
                    <span className="score-bar-text">
                        {game.defensePoints}
                        {!results.won ? (
                            <i class="fa fa-solid fa-trophy game-trophy"></i>
                        ) : (
                            <i class="game-trophy"></i>
                        )}
                    </span>
                </div>
            }
            {!shouldAccordion && 
                gameBreakdown()
            }
            {shouldAccordion && 
                <>
                    {scoreCollapsed && 
                        <div className="collapsed-results border-s round-l" onClick={() => { setScoreCollapsed(false); setPlayersCollapsed(true); }}>
                            <div className="game-breakdown-row game-breakdown-row-padded game-breakdown-total">
                                <div className="game-breakdown-name">
                                    Total Points
                                </div>
                                <div className="game-breakdown-value">
                                    {results.scoreDiffs[gameState.bidder]}
                                    <i className="fa fa-solid fa-caret-down" style={{marginLeft: '5px'}}></i>
                                </div>
                            </div>
                        </div>
                    }
                    {!scoreCollapsed &&
                        gameBreakdown()
                    }
                </>
            }
        </>
    );

    const can = useRef();
    const cardPositions = [
        { x: 78, y : 95 },
        { x : 118, y : 95 }
    ];
    const cardRotations = [Math.PI * 1.975, Math.PI * 0.025];
    const SKAT_CANVAS_SIZE = 190;
    useEffect(() => {

        if(results.allPass && (!scoreCollapsed || !shouldAccordion)) {
            can.current.width = SKAT_CANVAS_SIZE * window.devicePixelRatio;
            can.current.height = SKAT_CANVAS_SIZE * window.devicePixelRatio;
            can.current.style.width = SKAT_CANVAS_SIZE + 'px';
            can.current.style.height = SKAT_CANVAS_SIZE + 'px';

            const ctx = can.current?.getContext('2d');
            for (let i = 0; i < gameState.skat.length; i++) {
                let card = new Card(gameState.skat[i].charAt(0), gameState.skat[i].charAt(1));

                card.position.x = cardPositions[i].x * window.devicePixelRatio;
                card.position.y = cardPositions[i].y * window.devicePixelRatio;
                card.position.rotation = cardRotations[i];

                card.oldPos = {...card.position};
                card.draw(ctx, NaN, 100 * window.devicePixelRatio);
            }
        }
    }, [scoreCollapsed, shouldAccordion]);

    const skatCanvas = (
        <div className="results-skat-canvas-container">
            <div>Skat</div>
            <canvas className="skat-canvas" width="190px" height="190px" ref={can}></canvas>
        </div>
    );

    return (
        <div className="results-menu border-m round-xl regular">
            <div class="game-results-info">
                {!results.allPass && gameResults()}
                {results.allPass && (
                    <>
                        <div className={pillClass()}>
                            All Pass
                        </div>
                        {!shouldAccordion && 
                            skatCanvas
                        }
                        {shouldAccordion && 
                            <>
                                {scoreCollapsed && 
                                    <div className="collapsed-results border-s round-l" onClick={() => { setScoreCollapsed(false); setPlayersCollapsed(true); }}>
                                        <div className="game-breakdown-row game-breakdown-row-padded game-breakdown-total">
                                            <div className="game-breakdown-name">
                                                Skat
                                            </div>
                                            <div className="game-breakdown-value">
                                                <i className="fa fa-solid fa-caret-down" style={{marginLeft: '5px'}}></i>
                                            </div>
                                        </div>
                                    </div>
                                }
                                {!scoreCollapsed &&
                                    skatCanvas
                                }
                            </>
                        }
                    </>
                )}

            
            </div>
            <div className="results-player-info">
                <div className="results-player-info-list">
                    {shouldAccordion && playersCollapsed && 
                        <div className="collapsed-results border-s round-l" onClick={() => { setScoreCollapsed(true); setPlayersCollapsed(false); }}>
                            <div className="game-breakdown-row game-breakdown-row-padded game-breakdown-total">
                                <div className="game-breakdown-name">
                                    Standings
                                </div>
                                <div className="game-breakdown-value">
                                    <i className="fa fa-solid fa-caret-down" style={{marginLeft: '5px'}}></i>
                                </div>
                            </div>
                        </div>
                    }
                    {(!playersCollapsed || !shouldAccordion) && 
                        playerInfo
                    }
                </div>
                <div className="results-player-info-next">
                    {!results.isComplete && 
                        <>
                            {!hitReady && <div className="next-btn border-s round-l" onClick={handleReadyForNext}>Next</div>}
                            {hitReady && <div>Waiting for other players...</div>}
                        </>
                    }
                    {results.isComplete && <div className="next-btn border-s round-l" onClick={handleViewResults}>View Results</div>}
                </div>
            </div>
        </div>
    );
}

export default GameResults;