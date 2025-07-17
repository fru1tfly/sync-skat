import { useState, useContext } from "react";
import { UserContext } from "./UserContext";
import Header from "./components/Header";
import ProfilePicModal from "./components/ProfilePicModal";
import MediaQuery from "react-responsive";

import "./styles/profile.css";

export const Profile = () => {
    const userInfo = useContext(UserContext);
    const [showEditIcon, setShowEditIcon] = useState(false);
    const [showModal, setShowModal] = useState(false);

    return (
        <main>
            <Header />
            <div className="page-body">
                <div className="profile-info-container">
                    <MediaQuery query="(min-width: 600px)">
                        <div className="big-profile-pic border-l circle" onMouseOver={() => setShowEditIcon(true)} onMouseOut={() => setShowEditIcon(false)}>
                            <img src={userInfo?.profile_pic} alt="Profile Pic" width="200px"/>
                            {showEditIcon && 
                                <div className="profile-pic-edit-hover-btn" onClick={() => setShowModal(true)}>
                                    <div className="centered">
                                        <i className="fa fa-solid fa-pencil"></i>
                                    </div>
                                </div>
                            }
                        </div>
                    </MediaQuery>
                    <MediaQuery query="(max-width: 600px)">
                        <div className="big-profile-pic border-l circle">
                            <img src={userInfo?.profile_pic} alt="Profile Pic" width="200px"/>
                        </div>
                        <div className="profile-pic-edit-hover-btn" onClick={() => setShowModal(true)}>
                            <div className="centered">
                                <i className="fa fa-solid fa-pencil"></i>
                            </div>
                        </div>
                    </MediaQuery>
                    <div className="info-card border-l round-xl">
                        <div className="semi-bold title">
                            {userInfo?.username}
                            {/* <span style={{ marginLeft: '10px'}} className={`flag fi fi-${userInfo?.country} border-s`}></span> */}
                        </div>
                        <div className="regular info-card-body">
                            {userInfo?.bio}
                        </div>
                    </div>
                </div>
            </div>
            {showModal && 
                <ProfilePicModal closeModal={() => setShowModal(false)} />
            }
        </main>
    );
};

export default Profile;