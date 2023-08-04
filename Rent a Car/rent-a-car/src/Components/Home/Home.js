import { Link, useNavigate } from "react-router-dom";


export const Home = () => {
const navigate = useNavigate()
   const onClickFunction = (event) => {
       if(event){
        navigate('/catalog')
       }
    } 

    return(
        <>
    <div className="first-content">
    
        <div className="main-info">
            <div className="main-titles">
                <h1 className="main-title">
                    Luxury
                </h1>
                <h1 className="secound-title">
                    Deals
                </h1>
                <p className="title-content">
                    because class is timeless
                </p>
            </div>
           
           
            <button onClick={onClickFunction} className="get-yours">
                get yours now
            </button>
        </div>
        
    </div>
    <div className="suprime-services">
        <h1 className="supreme-title">
            we offer you supreme services
        </h1>
        <ul className="supreme-infos">
            <li className="supreme-info">
                <img src="/images/icons8-support-100.png" alt="support" clasname='supreme-info-img'/>
                <p className="service-desc">
                    24/7 Customer Support
                </p>
            </li>
            <li className="supreme-info-car">
                <img src="./images/icons8-car-key-100.png" alt="car-key" clasname='supreme-info-img'/>
                <p className="service-desc">
                    buy your luxury car with just a few clicks
                </p>
            </li>
            <li className="supreme-info">
                <img src="./images/icons8-receive-cash-100.png" alt="receive-cash" clasname='supreme-info-img'/>
                <p className="service-desc">
                    Sell or trade your car with ease
                </p>
            </li>
        </ul>
    </div>
    <div className="hot-deals">
        <h1 className="hot-deals-title"> 
            <span className="hot-deals-title-cl">hot</span> deals
        </h1>
        <ul className="hot-deals-infos">
            <li className="hot-deal-info">
                <img src="./images/listing 260px 146px.jpg" alt="car-image"/>
                <h5 className="hot-deal-model">mercedes benz convertible</h5>
                <p className="hot-deal-desc">
                    C-className Cabriolet
                </p>
                <p className="hot-deal-price">
                    $50,000
                </p>
            </li>
            <li className="hot-deal-info">
                <img src="./images/listing 260px 146px.jpg" alt="car-image"/>
                <h5 className="hot-deal-model">subaru legacy 2024</h5>
                <p className="hot-deal-desc">
                    C-className Cabriolet
                </p>
                <p className="hot-deal-price">
                    $24,350
                </p>
            </li>
        </ul>
    </div>
   
    </>
    );
};