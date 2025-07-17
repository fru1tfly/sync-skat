import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useRef } from "react";
import MediaQuery, { useMediaQuery } from "react-responsive";

import Header from "./components/Header";
import Dropdown from "./components/Dropdown";
import EventData from "./components/EventData";
import TableData from "./components/TableData";
import CreateModal from "./components/CreateModal";

import "./styles/lobby.css";

import { socket } from "./components/socket";
import { UserContext } from "./UserContext";
import { renderUserName, removeKey } from "./components/utils";
import { Modal } from "./components/Modal";


let scrolledToBottom = true;
let windowScrolledToBottom = false;

export const Lobby = (props) => {

    const { dummy } = props;
    console.log(dummy);

    const nav = useNavigate();
    const isCondensed = useMediaQuery({ query: '(max-width: 1200px)' });

    const userInfo = useContext(UserContext);
    const [tables, setTables] = useState({});
    const [events, setEvents] = useState({});

    const [activeChat, setActiveChat] = useState('main');
    const activeChatRef = useRef(activeChat);
    const [createType, setCreateType] = useState('');
    const [chatMessage, setChatMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState({});

    const [mobileOnlineOpen, setMobileOnlineOpen] = useState(false);
    const [mobileChatOpen, setMobileChatOpen] = useState(false);

    const [passwordOpen, setPasswordOpen] = useState(false);
    const [privateJoinData, setPrivateJoinData] = useState(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [showWrongMessage, setShowWrongMessage] = useState(false);
    const [shouldScroll, setShouldScroll] = useState(false);

    const chatWindow = useRef(null);
    const chatInput = useRef(null);
    const [messages, setMessages] = useState({});
    const [chatLabels, setChatLabels] = useState({'main':'Lobby'});
    const messagesRef = useRef(messages);
    const chatLabelsRef = useRef(chatLabels);

    // wrappers to update both state and ref
    const addLabel = (id, name) => {
        const newLabels = {...chatLabels, [id]: name};
        setChatLabels(newLabels);
        chatLabelsRef.current = newLabels;
        updateActiveChat(id);

        if(isCondensed) {
            setMobileChatOpen(true);
        } else {
            setShouldScroll(true);
        }
    };

    const removeLabel = id => {
        const newLabels = removeKey(id, chatLabels);
        setChatLabels(newLabels);
        chatLabelsRef.current = newLabels;

        if(activeChatRef.current === id) {
            updateActiveChat('main');
        }
    };

    const updateActiveChat = chat => {
        setActiveChat(chat);
        activeChatRef.current = chat;
    }

    const updateUsers = data => setOnlineUsers(data);
    const updateTables = data => setTables(data);
    const updateEvents = data => setEvents(data);

    // update messages for a specific chat
    const updateMessages = data => {
        const newMessages = {...messagesRef.current, [data.chat]: data.list};
        setMessages(newMessages);
        messagesRef.current = newMessages;
    };

    // retrieve all messages for the user
    const updateAllMessages = data => {
        let newMessages = {};
        let newLabels = {};

        for(let i = 0; i < data.lists.length; i++) {
            newMessages[data.chats[i][0]] = data.lists[i];     
            newLabels[data.chats[i][0]] = data.chats[i][1];
        }

        setMessages(newMessages);
        setChatLabels(newLabels);
        messagesRef.current = newMessages;
        chatLabelsRef.current = newLabels;
    };

    const groupCreated = data => {
        addLabel(data.id, data.label);
    }

    const startGame = () => nav('/play');

    const sendPassword = () => {
        socket.emit('send-password', {
            value: passwordInput,
            type: privateJoinData.type,
            id: privateJoinData.id,
            slot: privateJoinData.slot,
            username: userInfo.username,
            img: userInfo.profile_pic,
            country: userInfo.country
        });
    }

    const wrongPassword = () => {
        setShowWrongMessage(true);
        setPasswordInput('');
    }

    const rightPassword = (data) => {
        addLabel(data.id, data.label);
        setPasswordOpen(false);
    }

    const focusChat = (data) => {
        scrolledToBottom = true;
        updateActiveChat(data);
        if(isCondensed) {
            setMobileChatOpen(true);
        } else {
            setShouldScroll(true);
        }
    }

    const isWindowScrolled = (e) => {
        windowScrolledToBottom = window.scrollY === document.body.scrollHeight - document.body.parentElement.clientHeight;
        console.log(windowScrolledToBottom);
    }

    const handleEventRemoved = (data) => {
        removeLabel(data);
    }

    useEffect(() => {

        document.addEventListener('scroll', isWindowScrolled);

        socket.emit('get-data', userInfo?.username);

        socket.on('update-users', updateUsers);
        socket.on('update-tables', updateTables);
        socket.on('update-events', updateEvents);
        socket.on('update-messages', updateMessages);
        socket.on('update-all-messages', updateAllMessages);
        socket.on('wrong-password', wrongPassword);
        socket.on('right-password', rightPassword);
        socket.on('focus-chat', focusChat);

        socket.on('start-game', startGame);
        socket.on('group-created', groupCreated);
        socket.on('event-removed', handleEventRemoved);

        return () => {
            document.removeEventListener('scroll', isWindowScrolled);
            socket.off('update-users', updateUsers);
            socket.off('update-tables', updateTables);
            socket.off('update-events', updateEvents);
            socket.off('update-messages', updateMessages);
            socket.off('update-all-messages', updateAllMessages);
            socket.off('wrong-password', wrongPassword);
            socket.off('right-password', rightPassword);
            socket.off('focus-chat', focusChat);

            socket.off('start-game', startGame);
            socket.off('group-created', groupCreated);
            socket.off('event-removed', handleEventRemoved);
        };

    }, []);

    useEffect(() => {
        console.log(scrolledToBottom);
        if(chatWindow.current && scrolledToBottom) {
            let scrollBehavior = 'smooth';
            if(chatWindow.current?.scrollTop + chatWindow.current.clientHeight < chatWindow.current.scrollHeight - 30) {
                scrollBehavior = 'instant';
            } else if(windowScrolledToBottom) {
                setShouldScroll(true);
            }
            chatWindow.current?.scrollTo({top: chatWindow.current.scrollHeight, behavior: scrollBehavior});
            scrolledToBottom = true;
        }
    }, [messages, activeChat, mobileChatOpen]);

    useEffect(() => {
        if(shouldScroll) {
            window.scrollTo({top: document.body.scrollHeight, left: 0, behavior: 'smooth'});
            setShouldScroll(false);
            windowScrolledToBottom = true;
        }
    }, [shouldScroll, activeChat]);

    const allUsers = (usrs) => {
        return Object.values(usrs).map(u => {
            return (
                <div className="lobby-list-item">
                    <MediaQuery query="(min-width: 501px)">
                        {renderUserName(u, 20)}
                    </MediaQuery>
                    <MediaQuery query="(max-width: 500px)">
                        {renderUserName(u, 24)}
                    </MediaQuery>
                    {u.status}
                </div>
            );
        });
    };

    const joinTable = (id, slot) => {
        if(tables[id].public) {
            socket.emit('join-table', {id: id, slot: slot, username: userInfo?.username, img: userInfo?.profile_pic, country: userInfo?.country});
            addLabel(id, 'Table');
        } else {
            setShowWrongMessage(false);
            setPasswordOpen(true);
            setPasswordInput('');
            setPrivateJoinData({type: 'table', id: id, slot: slot});
        }
    }

    const leaveTable = (id) => {
        socket.emit('leave-table', {id: id, username: userInfo.username});
        removeLabel(id);
    }

    const joinEvent = (id, name) => {
        if(events[id].public) {
            socket.emit('join-event', {id: id, username: userInfo.username, img: userInfo.profile_pic, country: userInfo.country});
            addLabel(id, name);
        } else {
            setShowWrongMessage(false);
            setPasswordOpen(true);
            setPasswordInput('');
            setPrivateJoinData({type: 'event', id: id});
        }
        
    }

    const leaveEvent = (id) => {
        socket.emit('leave-event', {id: id, username: userInfo.username});
        removeLabel(id);
    }

    const removeEvent = (id) => {
        socket.emit('remove-event', {id: id});
        removeLabel(id);
    }

    const sendMessage = () => {
        if(chatMessage) {
            // determine chat type
            let chatType = 0; // Lobby chat
            if(Object.keys(tables).includes(activeChat)) {
                chatType = 1;
            } else if(Object.keys(events).includes(activeChat)) {
                chatType = 2;
            }

            socket.emit('send-message', {msg: chatMessage, user: userInfo.username, chat: activeChat, chatType: chatType});
            setChatMessage('');
        }
    }

    const UserList = (props) => {
        const { title, usrs } = props;
        return (<div className="lobby-list-container llc-narrow">
            <div className="llc-header semi-bold lobby-narrow-title sub-menu-title">
                <i className="fa fa-solid fa-user-circle"></i> 
                {title} ({Object.keys(usrs).length})
            </div>
            <div className="lobby-list-body">
                {allUsers(usrs)}
            </div>
        </div>
        );
    };

    const Chat = () => (
        <div className="lobby-list-container border-l round-xl regular">
            <div className="llc-header semi-bold lobby-narrow-title sub-menu-title">
                <i className="fa fa-solid fa-comments"></i>
                Chat
            </div>
            <div className="lobby-list-body desktop-chat-window">
                <div className="desktop-chat-body">
                    <Dropdown data={chatLabels} selected={activeChat} setSelected={(id) => {updateActiveChat(id); if(!isCondensed) setShouldScroll(true);}} />
                    <div className="chat-text chat-body" ref={chatWindow} onScroll={(e) => {
                        scrolledToBottom = chatWindow.current.scrollTop > chatWindow.current.scrollHeight - chatWindow.current.clientHeight - 30;
                        console.log('we scrollin', scrolledToBottom);
                    }}> 
                        {messages[activeChat]?.map(m => {
                            const time = new Date(m.time).toLocaleTimeString([], {hour: 'numeric', minute: 'numeric'});
                            return (
                                <div className="chat-message">
                                    {m.user !== 'system' &&
                                        <span><b><span style={{fontSize: '10px'}}>[{time}]</span> {m.user}:</b>&nbsp;{m.content}</span>
                                    }
                                    {m.user === 'system' &&
                                        <span style={{fontSize: '12px', color: 'blue'}}>{m.content}</span>
                                    }
                                </div>
                            );
                        })}
                    </div>
                    <div className="chat-bar">
                        <input type="text" 
                        ref={chatInput}
                        size="1"
                        className="border-s round-m chat-text" 
                        onChange={(e) => setChatMessage(e.currentTarget.value)} 
                        value={chatMessage} onKeyDown={(e) =>{ if(e.key === 'Enter') sendMessage()}} />
                        <div className="send-btn border-s round-m" onClick={sendMessage}>
                            <i className="fa fa-solid fa-send"></i>
                        </div>
                    </div>
                </div>
                <MediaQuery query="(min-width: 1200px)">
                    <UserList title="Online" usrs={onlineUsers}/>
                </MediaQuery>
            </div>
            
        </div>
    );

    return (
        <main>
            <Header />
            <div className="page-body lobby">
                <div className="lobby-center-section border-l round-xl">
                    <TableData 
                        tables={tables} 
                        user={onlineUsers[userInfo?.username]} 
                        join={joinTable} 
                        leave={leaveTable} 
                        openModal={(v) => setCreateType(v)}
                    />
                    
                    <EventData 
                        events={events} 
                        user={onlineUsers[userInfo?.username]} 
                        join={joinEvent} 
                        leave={leaveEvent} 
                        remove={removeEvent}
                        allUsers={allUsers}
                        openModal={(v) => setCreateType(v)}
                        onlineUsers={onlineUsers}
                    />
                </div>
                <MediaQuery query="(min-width: 1200px)">
                    {Chat()}
                </MediaQuery>
                <MediaQuery query="(max-width: 1200px)">
                    <div className="mobile-footer-btns-container">
                        <div className="border-l circle mobile-footer-btn" onClick={() => setMobileOnlineOpen(true)}>
                            <i className="fa fa-solid fa-globe" style={{fontSize: '38px'}}></i>
                        </div>
                        <div className="border-l circle mobile-footer-btn" onClick={() => setMobileChatOpen(true)}>
                            <i className="fa fa-solid fa-comment" style={{fontSize: '38px'}}></i>
                        </div>
                    </div>
                </MediaQuery>
            </div>
            {createType !== '' && <CreateModal createType={createType} closeModal={() => setCreateType('')}/>}

            <MediaQuery query="(max-width: 1200px)">
                {mobileOnlineOpen && 
                    <div className="modal-background">
                        <div className="lobby-table-modal">
                            <button className="close-modal-btn" onClick={() => setMobileOnlineOpen(false)}>
                                <i className="fa fa-solid fa-close"></i>
                            </button>
                            <div className="round-xl border-l" style={{flexGrow: 1, backgroundColor: '#c3f0d6'}}>
                                <UserList title="Online" usrs={onlineUsers}/>
                            </div>
                        </div>
                    </div>
                }
                {mobileChatOpen && 
                    <div className="modal-background">
                        <div className="lobby-table-modal">

                        <button className="close-modal-btn" onClick={() => setMobileChatOpen(false)}>
                            <i className="fa fa-solid fa-close"></i>
                        </button>
                            {Chat()}
                        </div>
                    </div>
                }
            </MediaQuery>
            
            {passwordOpen &&
                <Modal closeModal={() => setPasswordOpen(false)}>
                    <div className="flex10" style={{flexDirection: 'column'}}>
                        <div style={{flexGrow: 1}}>Enter Password</div>
                        {showWrongMessage && 
                            <p style={{color: '#AA4A44', fontWeight: 600}}>Incorrect password</p>
                        }
                        <input 
                            className="border-m round-l form-input regular" 
                            type="password" 
                            value={passwordInput} 
                            onChange={(e) => setPasswordInput(e.currentTarget.value)}
                            onKeyDown={(e) =>{ if(e.key === 'Enter') sendPassword()}}
                        /> 
                        <button className="btn-primary selected border-m round-l semi-bold title"
                            onClick={sendPassword}
                        >
                            Submit
                        </button>
                    </div>
                </Modal>
            }
        </main>
    );
}

export default Lobby;