export const Footer = () => {
    return(
        <div className="main-footer">
        <div className="footer-logos">
            <img src="/images/./black.png" alt="logo" className="logo"/>
            <div className="footer-social-logos">
                <i className="fa-brands fa-facebook-f fa-2xl"></i>
                <i className="fa-brands fa-twitter fa-2xl"></i>
                <i className="fa-brands fa-instagram fa-2xl"></i>
            </div>
            
        
        </div>
        <div className="footer-info">
            <ul className="footer-desc-company">
                <li className="footer-desc-title">company</li>
                <li className="footer-links">about us</li>
                <li className="footer-links">Get Help</li>
                <li className="footer-links">terms of use</li>
                <li className="footer-links">privacy policy</li>
                <li className="footer-links">accessibility</li>
                <li className="footer-links">cookie preferences</li>
            </ul>
            <ul className="footer-desc-location">
                <li className="footer-desc-title">location</li>
                <li className="footer-links">23 Anywhere St.</li>
                <li className="footer-links">Any City</li>
                <li className="footer-links">state,</li>
                <li className="footer-links">Country </li>
                <li className="footer-links">12345</li>
            </ul>
        </div>
    </div>
    );
};