import { createContext } from "react";
import {useLocalStorage} from "../customHooks/localStorageHook";


export const UserContext = createContext();

export const AuthComponent = ({children}) => {
  const [user, setUser] = useLocalStorage("auth", {});

  const loggedUser = (userData) => {
    setUser(userData);
  };
return <UserContext.Provider value={{ user, loggedUser }}>
        {children}
        </UserContext.Provider>
};
