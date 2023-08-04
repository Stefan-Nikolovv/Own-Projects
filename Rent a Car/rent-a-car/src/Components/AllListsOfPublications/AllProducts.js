import { useEffect, useState } from "react";
import * as publicationService from '../../services/publicationService';
import { Product } from "./productList/Product";





export const AllProducts = () => {

   const [publication, currentPubs] = useState([]);

    useEffect(() => {
        publicationService.getAll()
        .then(result => {
            currentPubs(result);
           })
           .catch((err) => {
            console.log(err)
           })
          return () => currentPubs([]);
          },[])
    console.log(publication)
          
    return (
        <div className="listed-cars-page">
        <h1 className="listed-cars-title">
            Listed Cars
        </h1>
        <ul className="listed-cars-infos">
            
            {publication.length > 0 
            
            ?
            publication.map(x => <Product key={x._carid} product={x}/>)
            :
            <>Loading</>
            }
            
        </ul>
    </div>
    );
};