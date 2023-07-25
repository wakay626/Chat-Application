import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";

export default function RegisterAndLoginForm () {

    const [username, setUsername] = useState ('');
    const [password, setPassword] = useState ('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');
    const {setLoggedInUserName, setId} = useContext(UserContext);

    //Submit Form
    async function handleSubmit (ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === 'register' ? 'register' : 'login';
    const {data} = await axios.post(url, {username,password});
    setLoggedInUserName(username);
    setId(data.id); 
    }

    return (
        <div className="bg-green-50 h-screen flex items-center">
            <form action="" className="w-80 mx-auto" onSubmit={handleSubmit}>
                <input value={username} 
                       onChange={ev => setUsername(ev.target.value)} 
                       type="text" 
                       placeholder="username" 
                       className="block w-full rounded-md p-3 mb-3 border" />
                <input value={password}
                       onChange={ev => setPassword(ev.target.value)} 
                       type="password" 
                       placeholder="password" 
                       className="block w-full rounded-md p-3 mb-3 border"/>
                <button className="bg-blue-500 text-white block w-full rounded-md p-3">
                    {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                </button>
                <div className="text-center mt-2">
                    {isLoginOrRegister === 'register' && (
                        <div>
                        Are you a member? 
                            <button onClick={() => setIsLoginOrRegister('login')}>
                            Login Here
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                        Not a member? 
                            <button onClick={() => setIsLoginOrRegister('register')}>
                            Register Here
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}