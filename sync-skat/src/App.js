import axios from "axios";
import { socket } from "./components/socket";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Route, Routes } from "react-router-dom";

import AuthGuard from "./AuthGuard";
import { UserContext } from "./UserContext";

import Home from "./Home";
import Lobby from "./Lobby";
import Profile from "./Profile";
import SyncSkat from "./SyncSkat";
import GroupResults from "./GroupResults";
 

function App() {
	const { user } = useAuth0();

	const [userInfo, setUserInfo] = useState(null);

	const dummyVal = 'hyep';

	useEffect(() => {
		if(user) {
			axios.get('/api/user-info', {
				headers: {
					'Content-Type': 'application/json',
					'username': user.username,
					'auth0Pic': user.picture
				}
			}).then(res => {
				setUserInfo(res.data);

				socket.emit('user-info', {
					username: res.data.username,
					profile_pic: res.data.profile_pic,
					country: res.data.country
				});
			});
		}

	}, [user]);


	return (
		<UserContext.Provider value={userInfo}>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/profile" element={<AuthGuard component={Profile} />} />
				<Route path="/lobby" element={<AuthGuard component={Lobby} dummy={dummyVal}/>} />
				<Route path="/play" element={<AuthGuard component={SyncSkat} />} />
				<Route path="/results/:id" element={<GroupResults />} />
			</Routes>
		</UserContext.Provider>
	);
}

export default App;
