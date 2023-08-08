import { useState, useEffect } from "react";
import * as publicationService from '../../services/publicationService';
import { Route, useLocation } from "react-router-dom";
import { Shoe } from "./Shoe/Shoe";
import { Filter } from "../Filter";
import { Sorter } from "../Sorter";

export const Shoes = () => {
  const [click, setClicked] = useState({
  });
  const location = useLocation();
  
  const[publication, setPublication] = useState([]);
  useEffect(() => {

    if (click.pickedColer === "") {
      publicationService.getAll(location.pathname)
        .then(result => {

          setPublication(result);
        })
        .catch((err) => {
          console.log(err)
        })
      return;
    }
    publicationService.getWatchesFiltered(click.pickedColer, "shoes")
      .then(result => {
        console.log(result, 'fetch3 colorpicked')
        setPublication(result);
      })
      .catch((err) => {
        console.log(err)
      })
    return () => setPublication([]);

  }, [click.pickedColer]);

 

  useEffect(() => {
    if (click.offset === undefined) {
      publicationService.getAll(location.pathname, 0)
        .then(result => {
          console.log('0 offset')
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
        setPublication(publication.concat(result));
      })
      .catch((err) => {
        console.log(err)
      })
    return () => setPublication([]);
  }, [click.offset]);


      const onClickHandler = (e) => {
        if (e.name === 'filter') {
          if (click.filter === true) {
            return setClicked({ ...click, filter: false })
          } else {
            setClicked({ ...click, filter: true });
          };
        };
    
        if (e.name === 'color') {
          if (click.color === true) {
            return setClicked({ ...click, color: false })
          } else {
            setClicked({ ...click, color: true });
          };
        };
    
        if (e.name === 'price') {
          if (click.price === true) {
            return setClicked({ ...click, price: false })
          } else {
            setClicked({ ...click, price: true });
          };
        };
    
        if (e.name === 'sort') {
          if (click.sort === true) {
            return setClicked({ ...click, sort: false })
          } else {
            setClicked({ ...click, sort: true });
          };
        };
        if (e.name === 'black') {
          if (click.black === true) {
    
            return setClicked({ ...click, black: false, pickedColer: "" })
          } else {
            setClicked({ ...click, black: true, white: false, pickedColer: "black", range1000:false, range2000:false });
          };
        }
    
        if (e.name === 'white') {
    
          if (click.white === true) {
    
            return setClicked({ ...click, white: false, pickedColer: "" })
          } else {
            setClicked({ ...click, white: true, black: false, pickedColer: "white",range1000:false, range2000:false });
    
          };
        }
        if(e.name === "1000"){
         
          if(click.range1000 === true){
            console.log('here 1000 true')
            return setClicked({ ...click, range1000: false})
          }else{
            setClicked({ ...click, range1000: true, range2000:false});
            setPublication(publication.filter(x =>{
              return x.price > 0 && x.price <= 1000;
            }))
          }
        }
        if(e.name === "2000"){
          console.log('here 2000')
          if(click.range2000 === true){
            return setClicked({ ...click, range2000: false})
          }else{
            setClicked({ ...click, range2000: true, range1000: false,});
            setPublication(publication.filter(x =>{
              return x.price > 1000 && x.price <= 2000;
            }))
          }
        }
        return;
      }
      const offsetHnadler = async (e) => {
        let page = click.page;
        if(click.page === undefined){
           page = 1;
        }
    
        
        let offset = click.offset;
        const limit = 5;
        
        if (page > 1 ) {
          offset = limit * (page);
          page++;
        } else {
          offset = 5;
          page++;
        }
       
        setClicked({ ...click, offset: offset, page: page });
    
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
    
};

const priceDecending = () => {
  
   setPublication(publication.sort(function(a, b) {
      return Number(a.price) < Number(b.price) ? 1 : -1 
   }).slice(0, ))
   
};

return (
  <div class="main-info-products">
      <Filter
          click={click}
          onClickHandler={onClickHandler}
      />
      <div class="list-items-sorting">
          <Sorter
              click={click}
              onClickHandler={onClickHandler}
              onAlphabetDown={AlphabetDown}
              onAlphabetUp={AlphabetUp}
              onPriceAcending={priceAcending}
              onPriceDecending={priceDecending}
          />
          <div class="listed-items-page">
              <h1 class="listed-items-title">
                  Listed Items
              </h1>
              <ul class="listed-items-infos">
                  {publication.length > 0
                      ? publication.map(x => <Shoe key={x.id} product={x} />)
                      : <>Loading.....</>
                  }
              </ul>
              <div class="load-more-publications">
              <button onClick={offsetHnadler} className="load-more-pub">Load more....</button>
              </div>
          </div>
      </div>
  </div>
);
};