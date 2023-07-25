import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";


export default function ChatPage () {
    const [ws,setWs] = useState(null);
    const [selectedUserId, setSelecteUserId] = useState(null);
    const [newChat, setNewChat] = useState('');
    const {username,id,setId,setUsername} = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const divUnderMessages = useRef();
    const [onlineUsers, setOnlineUsers] = useState({});
    const [offlinePeople, setOfflinePeople] = useState({});
    useEffect(() => {
        connectToWs();
    }, []);

    //Reconnect to websocket
    function connectToWs () {
        const ws = new WebSocket('ws://localhost:4020');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Disconnected');
                connectToWs();
            }, 1000);
        });
    }

    //Exclude User from the list
    const excludingMyUsername = {...onlineUsers};
    delete excludingMyUsername[id];

    //Remove duplicate message
    const messageWithoutDuplicate = uniqBy(messages, '_id');

    //Show online Users
    function showOnlineUser(usersArray) {
        const users = {};
        usersArray.forEach(({userId,username}) => {
        users[userId] = username;
        });
        setOnlineUsers(users);
    }
    //Handling Messages
    function handleMessage(e) {
        const messageData = JSON.parse(e.data);
        console.log({e, messageData});
        if ('online' in messageData) {
            showOnlineUser(messageData.online);
        } else if ('text' in messageData) {
           setMessages(prev => ([...prev, {...messageData}]));
        }
    }

    //Logout User
    function logout() {
        axios.post('/logout').then(() => {
            setWs(null);
            setId(null);
            setUsername(null);
        });
    }

    //Sending Messages
    function sendMessage(ev) {
       ev.preventDefault(); 
       ws.send(JSON.stringify({
            recipient: selectedUserId,
            text: newChat,
       }));
       setNewChat('');
       setMessages(prev => ([...prev,{
        text: newChat, 
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
        }]));
    }

        useEffect(() => {
            const div = divUnderMessages.current;
            if (div) {
                div.scrollIntoView({behavior:'smooth', block:'end'});
            }
        }, [messages]);

        //Show online users effect
        useEffect (() => {
            axios.get('/people').then(res => {
                const offlinePeopleArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlineUsers).includes(p._id));

                const offlinePeople = {};
                offlinePeopleArr.forEach(p => {
                    offlinePeople[p._id] = p;
                });
                setOfflinePeople(offlinePeople);
            });
        }, [onlineUsers]);

        //Show message from the database effect
        useEffect (() => {
            if (selectedUserId) {
                axios.get('/messages/'+selectedUserId).then(res => {
                    setMessages(res.data);
                })
            }
        }, [selectedUserId]);
    //Select User
    // function selectUser (userId) {
    //     setSelecteUserId(userId);
    // }

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3 flex flex-col">
                <div className="flex-grow">
                <Logo />
                    {Object.keys(excludingMyUsername).map(userId => (
                          <Contact
                            key={userId}
                            id={userId}
                            online={true}
                            username={excludingMyUsername[userId]}
                            onClick={() => setSelecteUserId(userId)}
                            selected = {userId === selectedUserId}
                          />
                    ))}
                    {Object.keys(offlinePeople).map(userId => (
                          <Contact
                            key={userId}
                            id={userId}
                            online={false}
                            username={offlinePeople[userId].username}
                            onClick={() => setSelecteUserId(userId)}
                            selected = {userId === selectedUserId}
                          />
                    ))}
                </div>
                
                <div className="p-2 text-center flex items-center justify-center">
                    <span className="mr-2 text-sm text-black-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-1">
                        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                        </svg>
                        {username}
                    </span>
                    <button onClick={logout} className="text-sm text-black-500 bg-slate-400 rounded-md px-5 py-2">
                        Logout
                    </button>
                </div>
            </div>
            <div className="flex flex-col bg-green-100 w-2/3 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-300">&larr; Select a person from sidebar</div>
                        </div>
                    )}
                    {!!selectedUserId && (
                        <div className="mb-4 h-full">
                            <div className="relative h-full">
                                <div className="overflow-y-scroll absolute inset-0">
                                {messageWithoutDuplicate.map(message => (
                                    <div key={message._id} className={(message.sender === id ? 'text-right': 'text-left')}>
                                        <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " +(message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')}>
                                        {message.text}
                                        </div>
                                    </div>
                                ))}
                                    <div ref={divUnderMessages}></div>
                                </div>
                            </div>
                        </div>
                        
                    )}
                </div>
                { !!selectedUserId && (
                    <form className="flex gap-1" onSubmit={sendMessage}>
                    <input  type="text"
                            value={newChat}
                            onChange={ev => setNewChat(ev.target.value)}
                            placeholder="Type message here"
                            className="bg-white border-2 p-2 rounded-3xl w-4/6" />
                    <button type="submit" className="p-1 text-black rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    </button>
                </form>
                )}
            </div>
            
        </div>
    );
}