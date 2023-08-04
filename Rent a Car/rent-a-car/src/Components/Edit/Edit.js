import { useEffect, useState } from "react";
import * as pulicationService from '../../services/publicationService';
import {  useParams } from "react-router-dom";

export const Edit = () => {
    const params = useParams();
    const [car, currentCar] = useState([]);
       
    
        useEffect(() => {
            pulicationService.editOne(params.carid)
            .then(car => {
                currentCar(...car)
            })
         
            .catch(err => {
                console.log(err);
            })
            return currentCar([]);
        },[params.carId])

    return (
        <div class="edit-car-page">
        <h1 class="add-car-title">
            edit car
        </h1>
        <div class="personal-details">
            <p class="personal-details-form">Personal details</p>
            <form class="add-car-personal-info">
                <label for="pnumber">Username</label>
                <input defaultValue={car.personalname} type="text" id="pnumber" name="pnumber"/>
                <label for="city">City</label>
                <input  defaultValue={car.city} type="text" id="city" name="city"/>
                 <label for="country">Country</label>
                <input  defaultValue={car.country} type="text" id="country" name="country"/>
                <label for="pcode">Phone numbe</label>
                <input defaultValue={car.phonenumber} type="text" id="pcode" name="pcode"/>
            </form>
        </div>
        <div class="car-details">
            <p class="car-details-form">Car Details</p>
            <form class="add-car-desc">
                <label for="brand">brand</label>
                <input defaultValue={car.brand} type="text" id="brand" name="brand"/>
                <label for="model">model</label>
                <input defaultValue={car.model} type="text" id="model" name="model"/>
                <label for="year">year</label>
                <input defaultValue={car.year} type="text" id="year" name="year"/>
                <label for="imageUrl">image url</label>
                <input defaultValue={car.imageurl} type="text" id="imageUrl" name="imageUrl"/>
                <label for="price">price</label>
                <input defaultValue={car.price} type="text" id="price" name="price"/>
                <label for="description">description</label>
                <input defaultValue={car.description} type="text" id="description" name="description"/>
            </form>
        </div>
        <button class="submit-car">
            Submit
        </button>
    </div>
    );
};