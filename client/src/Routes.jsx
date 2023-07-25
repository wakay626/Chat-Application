import { useContext } from "react";
import RegisterAndLoginForm from "./RegisterAndLoginForm";
import { UserContext } from "./UserContext";
import ChatPage from "./ChatPage";

export default function Routes() {
 const {username, id} = useContext(UserContext);
    if (username) {
        return <ChatPage/>
    }
 return (
    <RegisterAndLoginForm />
 );
}