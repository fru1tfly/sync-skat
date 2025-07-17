import { useState, useRef } from "react";

import "./styles/lobby.css";

const Chat = (props) => {
    const [chatMessage, setChatMessage] = useState('');
    
    const [activeChat, setActiveChat] = useState('main');
    const activeChatRef = useRef(activeChat);
    const [shouldScroll, setShouldScroll] = useState(false);
    const chatWindow = useRef(null);
    const chatInput = useRef(null);
    
    const [messages, setMessages] = useState({});
    const [chatLabels, setChatLabels] = useState({'main':'Lobby'});
    const messagesRef = useRef(messages);
    const chatLabelsRef = useRef(chatLabels);
};

export default Chat;