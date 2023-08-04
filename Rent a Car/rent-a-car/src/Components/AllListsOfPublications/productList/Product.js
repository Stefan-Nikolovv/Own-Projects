import { Link } from "react-router-dom";

export const Product = ({product}) => {
    return (
        <li className="listed-deal-info">
        <img src={product.imageurl} alt={product.brand}/>
        <h5 className="listed-deal-model">Model: {product.model}</h5>
        <p className="listed-deal-desc">
        Description:{product.description}
        </p>
        <div className="price-sellbtn">
            <span className="listed-car-price">
           Price: $ {product.price}
            </span>
            <Link to={`/details/${product._carid}`} className="lister-car-price">
               See More
            </Link>
        </div>
    </li>
    );
   
}