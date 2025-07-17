import "./styles/results.css";
import axios from "axios";
import Header from "./components/Header";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const GroupResults = () => {

    const { id } = useParams();

    useEffect(() => {
        axios.get('/api/group-results', {
            headers: {
                'Content-Type': 'application/json',
                'id': id
            }
        }).then(res => {
            console.log(addPlaces(res.data));
            setPlayers(addPlaces(res.data));
        });
	}, []);


    const [players, setPlayers] = useState([]);

    const addPlaces = (results) => {
        let place = 0;
        let placeDupCount = 0;

        results.forEach((p, ind) => {
            if(ind === 0 || p.score !== results[ind - 1].score) {
                place += placeDupCount + 1;
                placeDupCount = 0;
            } else if(p.score === results[ind - 1].score) {
                placeDupCount++;
            }

            p.place = place;
        });

        return results;
	}

    const getPodiumClass = (place) => {
        switch(place) {
            case 1:
                return 'podium-base podium-base-gold';
            case 2:
                return 'podium-base podium-base-silver';
            case 3:
                return 'podium-base podium-base-bronze';
            default:
                return 'podium-base';
        }
    }

    return (
        <>
        <Header />
        <div class="page-body">
            <div className="page-card border-l round-xl">
                <div className="bold title" style={{textAlign: 'center'}}>Results</div>
                {players.length > 0 && 
                    <div className="results-container">
                        <div className="podium-container">
                            <div className="podium">
                                <div className="podium-slot semi-bold">
                                    {players[1].username}
                                    <div className="result-image-container circle">
                                        <img alt="Profile Pic" src={players[1].profile_pic} width="50px" height="50px" />
                                    </div>
                                    <div className={getPodiumClass(players[1].place)}></div>
                                </div>
                                <div className="podium-slot semi-bold">
                                    {players[0].username}
                                    <div className="result-image-container circle">
                                        <img alt="Profile Pic" src={players[0].profile_pic} width="50px" height="50px" />
                                    </div>
                                    <div className="podium-base podium-base-gold"></div>
                                </div>
                                <div className="podium-slot semi-bold">
                                    {players[2].username}
                                    <div className="result-image-container circle">
                                        <img alt="Profile Pic" src={players[2].profile_pic} width="50px" height="50px" />
                                    </div>
                                    <div className={getPodiumClass(players[2].place)}></div>
                                </div>
                            </div>
                        </div>
                        <div className="results-table border-m round-l regular selected">
                            {players.map((player, ind) => (
                                <div className="player-info-results border-s round-l">
                                    <div className="player-rank round-l border-s bold">{player.place}</div>
                                    <div className="player-image-container circle" style={{width: '35px', height: '35px'}}>
                                        <img alt="Profile Pic" src={player.profile_pic} width="100%" height="100%" />
                                    </div>
                                    <div className="player-results-username">
                                        {player.username}
                                    </div>
                                    <div className="player-info-record">
                                        <span>{player.wins}-{player.losses}</span>
                                        <span className="player-info-record-score">{player.score}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                }

            </div>
        </div>
        </>
    );
}

export default GroupResults;