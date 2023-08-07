import { Link } from "react-router-dom";



export const Header = () => {
    return(
        <header className="main-header main-wrapper">
        <img src="./style/7b5fd9f074cf1ec3709271398dcf653a.jpg" alt="logo" className="logo-header"/>
    <ul className="nav" >
        <Link to={'/bags'} className="nav-item" role="presentation">
         Bags
        </Link>
        <Link to={'/shoes'} className="nav-item" role="presentation">
         Shoes
        </Link>
        <Link to={'/watches'} className="nav-item" role="presentation">
         Watches
        </Link>
      </ul>
  </header>
    );
};