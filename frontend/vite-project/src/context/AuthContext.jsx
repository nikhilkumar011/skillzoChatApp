import {createContext,useState,useEffect} from 'react'
export const AuthContext = createContext();

export const AuthContextProvider = ({children}) =>{
    const [email,setEmail] = useState(null);
    const [token,setToken] = useState(null);
    const [_id,setId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [name,setName] = useState(null);


   useEffect(() => {
   const storedEmail = localStorage.getItem("email");
   const storedToken = localStorage.getItem("token");
   const storedId = localStorage.getItem("_id"); 
   const storedName = localStorage.getItem("name");


   if (storedEmail && storedToken && storedId && storedName) {
      setEmail(storedEmail);
      setToken(storedToken);
      setId(storedId); 
      setName(storedName);
   }

   setLoading(false);
}, []);

    const login = (email,token,_id,name) =>{
        setEmail(email);
        setToken(token);
        setId(_id);
        setName(name);
        localStorage.setItem("email",email);
        localStorage.setItem("token",token);
        localStorage.setItem("_id",_id);
        localStorage.setItem("name", name);
    }

    const logout = () =>{
        setEmail(null);
        setToken(null);
        setId(null);
        setName(null);
        localStorage.removeItem("email");
        localStorage.removeItem("token");
        localStorage.removeItem("_id");
        localStorage.removeItem("name");
    }

    return(
        <AuthContext.Provider value={{email,token,login,logout,loading,_id,name}}>
             {children}
        </AuthContext.Provider>
    )
}