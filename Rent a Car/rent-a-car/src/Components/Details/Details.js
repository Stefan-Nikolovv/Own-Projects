import { useEffect, useState } from "react";
import * as pulicationService from '../../services/publicationService';
import {  Link, useParams } from "react-router-dom";


export const Details = () => {
const params = useParams();
const [car, currentCar] = useState([]);
   

    useEffect(() => {
        pulicationService.getOne(params.carId)
        .then(car => {
            currentCar(...car)
        })
     
        .catch(err => {
            console.log(err);
        })
        return currentCar([]);
    },[params.carId])

   
    
       
    return (
    
        <div class="car-details-page">
           
            <h1 class="details-page-title">
             details
            </h1>
            <div class="car-details-infos">
                
                <div class="car-details-desc">
                <h1 className="car-details-desc-title"> Car Details</h1>
                <img src={car.imageurl} alt="car-logo" class="details-page-img"/>
                <div className="car-deitals-allInfo">
                    <ul class="details-page-main-fields">
                        <li>
                            brand:
                        </li>
                        <li>
                            Model:
                        </li>
                        <li>
                            year:
                        </li>
                        <li>
                            Price:
                        </li>
                        <li>
                            Description:
                        </li>
                    </ul>
                    <ul class="details-page-main-fields">
                        <li>
                            {car.brand}
                        </li>
                        <li>
                        {car.model}
                        </li>
                        <li>
                        {car.year}
                        </li>
                        <li>
                        ${car.price}
                        </li>
                        <li>
                        {car.description}
                        </li>
                    </ul>
                    </div>
                    <div class="btn-details-page">
                    <Link  to={`/edit/${car._carid}`} class="car-details-btn">
                    buy car
                </Link>
                </div>
                </div>
                
                <div className="personal-info-details-page">
                <h1 className="personal-title-dtlPage"> Contact Seller</h1>
                <img src={"hoot"} alt="car-logo" className="personal-page-img"/>
                <div className="person-details">
                <ul class="personal-info-fields">
                        <li>
                            Name:
                        </li>
                        <li>
                            Phone:
                        </li>
                        <li>
                            City:
                        </li>
                        <li>
                            Country:
                        </li>
                        
                    </ul>
                    <ul class="personal-info-main-fields">
                        <li>
                            {car.personalname}
                        </li>
                        <li>
                        {car.phonenumber}
                        </li>
                        <li>
                        {car.city}
                        </li>
                        <li>
                        {car.country}
                        </li>
                       
                    </ul>
                </div>
                
                </div>
                </div>
                
                </div>
    );
};