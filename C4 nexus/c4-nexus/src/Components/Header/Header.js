import * as React from "react";
import { Link } from "react-router-dom";

export const Header = () => {
    const [visible, setVisible] = React.useState(false);
    const onMenuClick = () => {
        setVisible(!visible);
    }

    return (
        <header className="main-header">
            <img src="./style/logo.jpg" alt="logo" className="logo-header" />
            <a className="menu nav-item" href="#" onClick={onMenuClick}>Menu</a>
            <nav className={`nav ${visible ? "visible" : ""}`}>
                <Link to={'/bags'} className="nav-item" role="presentation">
                    Bags
                </Link>
                <Link to={'/shoes'} className="nav-item" role="presentation">
                    Shoes
                </Link>
                <Link to={'/watches'} className="nav-item" role="presentation">
                    Watches
                </Link>
            </nav>
        </header>
    );
};