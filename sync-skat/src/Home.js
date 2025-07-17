import Header from "./components/Header";

import newsIcon from './assets/news-icon.png';
import playIcon from './assets/play-icon.png';
import learnIcon from './assets/learn-icon.png';
import puzzleIcon from './assets/puzzle-icon.png';
import analysisIcon from './assets/analysis-icon.png';
import practiceIcon from './assets/practice-icon.png';

import { Link } from "react-router-dom";

import './styles/home.css';

export const Home = () => {
    return (
        <main>
            <Header />
            <div className="page-body">
                <div className="menu-btns">
                    <Link to="/lobby" className="large-menu-btn round-xl border-l">
                        <div className="large-menu-btn-header">Play</div>
                        <div className="btn-content">
                            <img src={playIcon} className="large-menu-btn-image"></img>
                        </div>
                        <div className="large-menu-btn-description">Play against other users in casual games, events, and tournaments</div>
                    </Link>
                    {/* <div className="large-menu-btn round-xl border-l">
                        <div className="large-menu-btn-header">Minigames</div>
                        <div className="btn-content">
                            <img src={practiceIcon} className="large-menu-btn-image"></img>
                        </div>
                        <div className="large-menu-btn-description">Sharpen isolated skills with practice drills at scaling difficulties</div>
                    </div>
                    <div className="large-menu-btn round-xl border-l">
                        <div className="large-menu-btn-header">Puzzles</div>
                        <div className="btn-content">
                            <img src={puzzleIcon} className="large-menu-btn-image"></img>
                        </div>
                        <div className="large-menu-btn-description">Play through prebuilt hands against bots and find difficult wins</div>
                    </div>
                    <div className="large-menu-btn round-xl border-l">
                        <div className="large-menu-btn-header">Tutorials</div>
                        <div className="btn-content">
                            <img src={learnIcon} className="large-menu-btn-image"></img>
                        </div>    
                        <div className="large-menu-btn-description">Interactive lessons from complete beginner to intermediate level</div>
                    </div>
                    <div className="large-menu-btn round-xl border-l">
                        <div className="large-menu-btn-header">Analysis</div>
                        <div className="btn-content">
                            <img src={analysisIcon} className="large-menu-btn-image"></img>
                        </div>
                        <div className="large-menu-btn-description">Study questionable hands to find the best moves and winning probabilities</div>
                    </div>
                    <div className="large-menu-btn round-xl border-l">
                        <div className="large-menu-btn-header">News</div>
                        <div className="btn-content">
                            <img src={newsIcon} className="large-menu-btn-image"></img>
                        </div>
                        <div className="large-menu-btn-description">Announcements and recaps of ISPA tournaments <br/> (primarily US/Canada)</div>
                    </div> */}
                </div>
                <p>Skat is a fast-paced, strategic, trick-taking card game that combines luck and skill to be one of the most complex yet compelling games that can be played with a standard deck of playing cards.</p>
            </div>
        </main>
    );
};

export default Home;