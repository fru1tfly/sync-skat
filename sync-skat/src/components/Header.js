
import { useAuth0 } from "@auth0/auth0-react";
import logo from "../assets/header-logo.png";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../UserContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MediaQuery from "react-responsive";
import { Modal } from "./Modal";
import { socket } from "./socket";

import playIcon from '../assets/play-icon.png';

import "../styles/profile.css";

const Header = () => {
    const nav = useNavigate();
    const location = useLocation();
    const userInfo = useContext(UserContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

    const checkUserStatus = (data) => {
        if(data === 'InGame') {
            nav('/play');
        }
    }

    useEffect(() => {
        if(userInfo) {
            socket.emit('check-user-status');
            socket.on('user-status', checkUserStatus);

            return () => {
                socket.off('user-status', checkUserStatus);
            }
        }
    }, [userInfo]);

    const handleToggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleLogin = () => {
        loginWithRedirect({
            appState: {
                returnTo: "/"
            }
        });
    };

    const handleSignUp = () => {
        loginWithRedirect({
            appState: {
                returnTo: "/profile"
            },
            authorizationParams: { 
                screen_hint: "signup"
            }
        });
    };

    const info = () => (
        <>
            <div className="user-info semi-bold" onClick={handleToggleDropdown}>
                <MediaQuery query="(min-width: 501px)">
                    {userInfo?.username}
                </MediaQuery>
                <div className="player-image-container circle" style={{width: '35px', height: '35px'}}>
                    <img alt="Profile Pic" src={userInfo?.profile_pic} width="100%" height="100%"/>
                </div>
                <MediaQuery query="(min-width: 501px)">
                    {location.pathname !== '/lobby' && (
                        <Link to="/lobby">
                            <div className="header-btn round-l border-s bold">Play</div>
                        </Link>
                    )}
                </MediaQuery>
                
            </div>
            {dropdownOpen && (
                <>
                    <MediaQuery query="(min-width: 501px)">
                        <div className="border-m user-info-dropdown">
                                <span className="semi-bold user-info-dropdown-item" style={{cursor: 'default'}}>{userInfo?.username}</span>
                            <Link to="/profile" className="user-info-dropdown-item">
                                My Account
                            </Link>
                            <div className="user-info-dropdown-item" onClick={() => logout({ logoutParams: { returnTo: window.location.origin }})}>Log Out</div>
                        </div>
                    </MediaQuery>
                </>
            )}
        </>
    );

    return (
        <header>
            <div className="header-contents">
                <Link to="/" className="logo-btn mobile-title">
                    <img src={logo} className="header-logo"/>
                </Link>
                {isAuthenticated && !isLoading && info()}
                {!isAuthenticated && !isLoading &&
                    <main>
                        <MediaQuery query="(min-width: 501px)">
                            <div className="flex10 bold">
                                <div className="header-btn border-s round-l" onClick={handleLogin}>Log In</div>
                                <div className="header-btn border-s round-l" onClick={handleSignUp}>Sign Up</div>
                            </div>
                        </MediaQuery>
                        <MediaQuery query="(max-width: 500px)">
                            <div className="profile-image-container circle" onClick={handleLogin}>
                                <i className="fa fa-solid fa-user-circle mobile-modal-icon"></i>
                            </div>
                        </MediaQuery>
                    </main>
                }
            </div>
            <MediaQuery query="(max-width: 500px)">
                {dropdownOpen && 
                    <Modal closeModal={handleToggleDropdown}>
                        <div className="modal-contents">
                            <div className="flex10 mobile-title" style={{cursor: 'default'}}>
                                <div className="player-image-container circle" style={{width: '50px', height: '50px'}}>
                                    <img alt="Profile Pic" src={userInfo?.profile_pic} width="100%" height="100%"/>
                                </div>
                                <span className="semi-bold">
                                    {userInfo?.username}
                                </span>
                            </div>
                            <Link to="/lobby" className="flex10 play-mobile-btn">
                            <div className="play-mobile-text border-m round-l">Play</div>
                                <img src={playIcon} alt="Play" className="play-mobile-img" />
                            </Link>
                            <Link to="/profile" className="user-info-dropdown-item flex10 round-m border-m">
                                <i className="fa fa-circle-user mobile-modal-icon"></i>
                                My Account
                            </Link>
                            <div className="user-info-double">
                                <Link to="/lobby" className="user-info-dropdown-item flex10 round-m border-m">
                                    <i className="fa fa-solid fa-chart-simple mobile-modal-icon"></i>
                                    Stats
                                </Link>
                                <Link to="/lobby" className="user-info-dropdown-item flex10 round-m border-m">
                                    <i className="fa fa-solid fa-ellipsis mobile-modal-icon"></i>
                                    More
                                </Link>
                            </div>
                            <div className="user-info-double">
                                <Link to="/lobby" className="user-info-dropdown-item flex10 round-m border-m">
                                    <i className="fa fa-solid fa-gear mobile-modal-icon"></i>
                                    Settings
                                </Link>
                                <div className="user-info-dropdown-item flex10 round-m border-m" onClick={() => logout({ logoutParams: { returnTo: window.location.origin }})}>
                                    <i className="fa fa-solid fa-right-from-bracket mobile-modal-icon"></i>
                                    Log Out
                                </div>
                            </div>
                        </div>
                    </Modal>
                }
            </MediaQuery>
        </header>
    );
};

export default Header;