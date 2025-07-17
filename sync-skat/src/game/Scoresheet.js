import { useEffect, useRef } from "react";
import { Modal } from "../components/Modal";
import { useMediaQuery } from "react-responsive";

import "../styles/scoresheet.css";

const MULT_VALUES = [23, 24, 9, 10, 11, 12];

// Example
// {
//     player: 2,
//     won: false,
//     trumpSuit: 0,
//     matadors: 1,
//     multipliers: {
//       Hand: false,
//       Schneider: false,
//       'Schneider Announced': false,
//       Schwarz: false,
//       'Schwarz Announced': false,
//       Ouvert: false
//     },
//     value: 18
// }

const Scoresheet = (props) => {
    const { game, closeScoresheet, pastHands } = props;
    
    const isCondensedW = useMediaQuery({ query: '(max-width: 900px)' });
    const isCondensedH = useMediaQuery({ query: '(max-height: 400px)' });
    const centerContent = useRef(null);
    let records = [...game.players.map(p => {
        return {
            score: 0,
            wins: 0,
            losses: 0
        };
    })];
    let allPasses = 0;

    useEffect(() => {
        let center = centerContent.current;
        center.scrollTo(0, Math.max((game.handNumber - 4) * 28, 0));
    }, []);

    let remainingHands = [];
    for(let i = pastHands.length; i < game.totalHands; i++) {
        remainingHands.push(<tr>
            <td className="scoresheet-header-narrow">{i + 1}</td>
            <td className="scoresheet-header-seminarrow"></td>
            <td className="scoresheet-header-narrow"></td>
            <td className="scoresheet-header-narrow"></td>
            <td className="scoresheet-header-narrow"></td>
            <td className="scoresheet-header-narrow"></td>
            <td className="scoresheet-header-narrow"></td>
            <td className="scoresheet-header-narrow"></td>
            <td className="scoresheet-header-narrow"></td>
            <td className="scoresheet-header-narrow"></td>
            <td className="scoresheet-header-seminarrow"></td>
            <td className="scoresheet-header-seminarrow"></td>
            {records.map((r, j) => {
                let className = 'scoresheet-header-player';
                let classNameNarrow = 'scoresheet-header-narrow';
                if(i % game.players.length === j) {
                    className = 'dealer scoresheet-header-player';
                    classNameNarrow = 'dealer scoresheet-header-narrow';
                }
                return (
                <>
                    <td className={className}></td>
                    <td className={classNameNarrow}></td>
                    <td className={classNameNarrow}></td>
                </>);
            })}
            <td className="scoresheet-header-narrow"></td>
        </tr>);
    }

    const baseWidth = (isCondensedW || isCondensedH) ? 387 : 405;

    return (
        <Modal closeModal={closeScoresheet} style={{width: `${baseWidth + 150 * game.players.length}px`, height: `${276 + 28 * game.totalHands}px`, maxHeight: '95vh', maxWidth: '95vw'}}>
            <div className="scoresheet-container">
                <div style={{width: `${355 + 150 * game.players.length}px`}} className="table-component">
                    <table>
                        <tr>
                            <th rowspan="2" className="scoresheet-header flatten scoresheet-header-narrow">#</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-seminarrow">Base Value</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">With</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">Without</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">Hand</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">Schneider</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">Announced</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">Schwarz</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">Announced</th>
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">Ouvert</th>
                            <th colspan="2" className="scoresheet-header">Game Points</th>
                            {game.players.map(p => <th colspan="3" className="scoresheet-header player-name">{p.name}</th>)}
                            <th rowspan="2" className="scoresheet-header sideways scoresheet-header-narrow">All Pass</th>
                        </tr>
                        <tr>
                            <th className="scoresheet-header scoresheet-header-seminarrow">+</th>
                            <th className="scoresheet-header scoresheet-header-seminarrow">-</th>
                            {game.players.map(p => (<>
                                <th className="scoresheet-header scoresheet-header-player"></th>
                                <th className="scoresheet-header scoresheet-header-narrow">W</th>
                                <th className="scoresheet-header scoresheet-header-narrow">L</th>
                            </>))}
                        </tr>
                    </table>
                </div>
                <div ref={centerContent} className="center-content table-component" style={{width: `${355 + 150 * game.players.length}px`}}>
                    <table>
                        {pastHands.map((h, ind) => {
                            if(h.player !== -1) {
                                records[h.player].score += !h.overbid ? h.value * (h.won ? 1 : -2) : -2 * h.overbidValue;
                                records[h.player].wins += h.won ? 1 : 0;
                                records[h.player].losses += h.won ? 0 : 1;
                            } else {
                                allPasses++;
                            }
                            return (<tr>
                                <td className="scoresheet-header-narrow">{ind + 1}</td>
                                {h.player !== -1 && 
                                    <>
                                        <td className="scoresheet-header-seminarrow">{MULT_VALUES[h.trumpSuit + 2]}</td>
                                        <td className="scoresheet-header-narrow">{h.matadors > 0 && h.trumpSuit !== -2 ? h.matadors : ''}</td>
                                        <td className="scoresheet-header-narrow">{h.matadors < 0 && h.trumpSuit !== -2 ? Math.abs(h.matadors) : ''}</td>
                                        {!h.overbid &&
                                            <>
                                                <td className="scoresheet-header-narrow">{h.multipliers['Hand'] ? 'x' : ''}</td>
                                                <td className="scoresheet-header-narrow">{h.multipliers['Schneider'] ? 'x' : ''}</td>
                                                <td className="scoresheet-header-narrow">{h.multipliers['Schneider Announced'] ? 'x' : ''}</td>
                                                <td className="scoresheet-header-narrow">{h.multipliers['Schwarz'] ? 'x' : ''}</td>
                                                <td className="scoresheet-header-narrow">{h.multipliers['Schwarz Announced'] ? 'x' : ''}</td>
                                                <td className="scoresheet-header-narrow">{h.multipliers['Ouvert'] ? 'x' : ''}</td>
                                                <td className="scoresheet-header-seminarrow">{h.won ? h.value : ''}</td>
                                                <td className="scoresheet-header-seminarrow">{!h.won ? 2 * h.value : ''}</td>
                                            </>
                                        }
                                        {h.overbid &&
                                            <>
                                                <td colspan="6"  className="scoresheet-header-overbid">Overbid</td>
                                                <td className="scoresheet-header-seminarrow"></td>
                                                <td className="scoresheet-header-seminarrow">{h.overbidValue * 2}</td>
                                            </>
                                        }
                                    </>
                                }
                                {h.player === -1 && 
                                    <>
                                        <td className="scoresheet-header-seminarrow"></td>
                                        <td className="scoresheet-header-narrow"></td>
                                        <td className="scoresheet-header-narrow"></td>
                                        <td className="scoresheet-header-narrow"></td>
                                        <td className="scoresheet-header-narrow"></td>
                                        <td className="scoresheet-header-narrow"></td>
                                        <td className="scoresheet-header-narrow"></td>
                                        <td className="scoresheet-header-narrow"></td>
                                        <td className="scoresheet-header-narrow"></td>
                                        <td className="scoresheet-header-seminarrow"></td>
                                        <td className="scoresheet-header-seminarrow"></td>
                                    </>
                                }
                                
                                {records.map((r, i) => {
                                    let content = ['', '', ''];
                                    let className = 'scoresheet-header-player';
                                    let classNameNarrow = 'scoresheet-header-narrow';
                                    if(i === h.player) {
                                        content[0] = r.score;
                                        if(h.won)
                                            content[1] = r.wins;
                                        else
                                            content[2] = r.losses;
                                    }
                                    if(ind % game.players.length === i) {
                                        className = 'dealer scoresheet-header-player';
                                        classNameNarrow = 'dealer scoresheet-header-narrow';
                                    }
                                    return (
                                    <>
                                        <td className={className}>{content[0]}</td>
                                        <td className={classNameNarrow}>{content[1]}</td>
                                        <td className={classNameNarrow}>{content[2]}</td>
                                    </>);
                                })}
                                <td className="scoresheet-header-narrow">{h.player === -1 ? allPasses : ''}</td>
                            </tr>)
                        })}
                        {remainingHands.map(h => h)}
                    </table>
                </div>
                <div style={{width: `${355 + 150 * game.players.length}px`}} className="table-component">
                    <table>
                        <tr>
                            <td className="scoresheet-header-results">Game Points</td>
                            {records.map((r, i) => (
                                <>
                                    <td className="scoresheet-header-player">{r.score}</td>
                                    <td className="scoresheet-header-narrow">{r.wins}</td>
                                    <td className="scoresheet-header-narrow">{r.losses}</td>
                                </>
                            ))}
                            <td className="scoresheet-header-narrow">{allPasses}</td>
                        </tr>
                        <tr>
                            <td>(Wins - Losses) x 50</td>
                            {records.map((r, i) => (
                                <>
                                    <td>{(r.wins - r.losses) * 50}</td>
                                    <td className="dealer"></td>
                                    <td className="dealer"></td>
                                </>
                            ))}
                            <td className="dealer"></td>
                        </tr>
                        <tr>
                            <td>Others' Losses x {120 / records.length}</td>
                            {records.map((r, i) => {
                                let losses = 0;
                                for(let j = 0; j < records.length; j++) {
                                    if(j !== i) {
                                        losses += records[j].losses;
                                    }
                                }
                                return (
                                    <>
                                        <td>{(120 / records.length) * losses}</td>
                                        <td className="dealer"></td>
                                        <td className="dealer"></td>
                                    </>
                                )
                            })}
                            <td className="dealer"></td>
                        </tr>
                        <tr className="total-row">
                            <td>Total</td>
                            {game.players.map((p, i) => (
                                <td colspan="3">{p.score}</td>
                            ))}
                            <td className="dealer"></td>
                        </tr>
                    </table>
                </div>
            </div>
        </Modal>
    );
}

export default Scoresheet;