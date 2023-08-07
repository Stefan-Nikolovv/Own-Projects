import { useState, useEffect } from "react";
import * as publicationService from '../../services/publicationService';
import { Route, useLocation } from "react-router-dom";
import {Bag} from './Bag/Bag';

export const Bags = () => {
  const [click, setClicked] = useState({
  });
  const location = useLocation();
  
  const[publication, setPublication] = useState([]);
  useEffect(() => {
   
    if(click.pickedColer === ""){
      publicationService.getAll(location.pathname)
    .then(result => {
      
      setPublication(result);
       })
       .catch((err) => {
        console.log(err)
       })
       return;
    }
   publicationService.getWatchesFiltered(click.pickedColer, "bags")
    .then(result => {
      console.log(result, 'fetch3 colorpicked')
      setPublication(result);
       })
       .catch((err) => {
        console.log(err)
       })
       return () => setPublication([]);
      
      },[click.pickedColer]);

  useEffect( () => {
    publicationService.getAll(location.pathname)
    .then(result => {
      console.log(result, 'onload')
      click.page = 1;
      setPublication(result);
       })
       .catch((err) => {
        console.log(err)
       })
       return () => setPublication([]);
      },[]);

      useEffect( () => {
        if(click.offset === undefined){
         publicationService.getAll(location.pathname)
        .then(result => {
          
          setPublication(result);
           })
           .catch((err) => {
            console.log(err)
           })
           return;
        }
         publicationService.getAll(location.pathname, click.offset)
        .then(result => {
          console.log(result, 'fetch3 offset')
          setPublication(result);
           })
           .catch((err) => {
            console.log(err)
           })
           return () => setPublication([]);
          },[click.offset !== 0 ]);

const onClickHandler = (e) => { 
  if(e.name === 'filter'){
    if(click.filter === true){
     return setClicked({...click, filter: false })
    }else{
      setClicked({...click, filter: true });
    };
  };

  if(e.name === 'color'){
    if(click.color === true){
     return setClicked({...click, color: false })
    }else{
      setClicked({...click, color: true });
    };
  };

  if(e.name === 'price'){
    if(click.price === true){
     return setClicked({...click, price: false })
    }else{
      setClicked({...click, price: true });
    };
  };

  if(e.name === 'sort'){
    if(click.sort === true){
     return setClicked({...click, sort: false })
    }else{
      setClicked({...click, sort: true });
    };
  };
  if(e.name === 'black'){
    if(click.black === true){
     
      return setClicked({...click, black: false, pickedColer: "" })
     }else{
       setClicked({...click, black: true , white:false , pickedColer: "black"  });
     };
  }

  if(e.name === 'white'){
    
    if(click.white === true){
     
      return setClicked({...click, white: false,  pickedColer: "" })
     }else{
       setClicked({...click, white: true, black:false, pickedColer: "white"  });
       
     };
  }
 
  return;
}

const AlphabetDown = () => {
 setPublication(publication.sort((a,b) => {
  return (a.name)>(b.name) ? 1 : -1 

  }).slice(0, ))
  
};
const AlphabetUp = () => {
  setPublication(publication.sort(function(a, b) {
    return (a.name)<(b.name) ? 1 : -1  
   }
  ).slice(0, ));
};

const priceAcending = () => {
  setPublication(publication.sort(function(a, b) {
    return Number(b.price) < Number(a.price) ? 1 : -1 
  }).slice(0, ));
     console.log(publication, 'acendign')
};

const priceDecending = () => {
  
   setPublication(publication.sort(function(a, b) {
      return Number(a.price) < Number(b.price) ? 1 : -1 
   }).slice(0, ))
   console.log(publication, 'decending price')
};

const offsetHnadler = (e) => {
 const limit = 5;
 
 if(click.page > 1 ){
  click.offset = limit * (click.page - 1);
  click.page++;
 }
 click.offset = 0;
 click.page++;
 
}

  return(
    <div className="main-wrapper">
      <div className="main-info-products">
         <div className="filter-section .drop-down">
            <div className="dropdown"  onClick={(e) => onClickHandler(e.target)}>
                <button name="filter" className={`dropbtn`}>Filter</button>
                
                <div id="myDropdown" className={`dropdown-content ${click.filter ? "visible": ""}`}>
                <a  value={click.color}  name="color" >Color</a>
                <ul className={`colors-list ${click.color === true ? "visible": ""}`} >
                  <li  >
                   <input type="radio" id="black" name="black" value={"black"} checked={click.black}  /> Black
                  </li>
                  <li>
                  <input type="radio" id="white" name="white" value={"white"} checked={click.white} /> White
                  </li>
                </ul>
                <a  name="price" value={click.price} >Price</a>
                <ul className={`price-list ${click.price ? "visible": click.price = false}`}>
                  <li >
                   <input type="radio" /> $0-100$
                  </li>
                  <li>
                  <input type="radio" /> $101-200$
                  </li>
                </ul>
              </div>
              </div>
           
                
          </div>
        <div className="list-items-sorting">
         
          <div className="sort">
              <div className="category-info">
                  <h3 className="category-info-title"> <span className="category-title-name">List category:</span></h3>
                  <p className="category-description">  witch witch can going true all products </p>
              </div>
              <div className="dropdown-sort">
                  <button onClick={(e) => onClickHandler(e.target)} name="sort" className="dropbtn-sort">Sort</button>
                  <div id="myDropdown" className={`dropdown-content ${click.sort ? "visible": ""}`} >
                    <a  onClick={ AlphabetDown}>Alphabetical a-z</a>
                    <a  onClick={ AlphabetUp}>Alphabetical z-a</a>
                    <a  onClick={ priceAcending}>Price ascending.</a>
                    <a   onClick={ priceDecending}>Price descending.</a>
                  </div>
                </div>
            </div>
          <div className="listed-items-page">
              <h1 className="listed-items-title">
                  Listed Items
              </h1>
              <ul className="listed-items-infos">
                 {publication.length > 0
                 ?
                 publication.map(x => <Bag key={x.id} product={x}/>)
                 :
                 <>Loading.....</>
                 }
              </ul>
              <div className="load-more-publications" >
                  <button onClick={ offsetHnadler} className="load-more-pub">Load more....</button>
              </div>
          </div>
        </div>
      </div>
      </div>
  );
};