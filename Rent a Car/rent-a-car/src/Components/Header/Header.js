import { Link } from "react-router-dom";


export const Header = () => {
    return(

        <div className="nav-bar">
        <div className="header-img">
         <img alt="logo" src="/images/./white.png" className="logo"/>
        </div>
        <div className="header-links">
          <ul className="nav-links">
               <Link to="/" className="home-link">
                   Home
               </Link>
               <Link className="buy-link">
                   buy car
               </Link>
               <Link className="sell-link">
                   sell car
               </Link>
               <Link to='/login' className="login-link">
                   login
               </Link>
               <Link to='/register' className="singup-link"> 
                   sign up
               </Link>
           </ul>
        </div>
       
     </div>
       
      
        
    );
    
}