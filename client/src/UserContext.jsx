import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({children}) {
 const [username, setLoggedInUserName] = useState(null);
 const [id, setId] = useState(null);
 useEffect(() => {
    axios.get('/profile').then(response => {
        setId(response.data.userId);
        setLoggedInUserName(response.data.username);
    });
 }, []);
 return (
    <UserContext.Provider value={{ username, setLoggedInUserName, id, setId }}>
        {children}
    </UserContext.Provider>
 );
}