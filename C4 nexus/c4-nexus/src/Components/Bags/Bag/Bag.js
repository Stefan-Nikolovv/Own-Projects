export const Bag = ({ product }) => {
  return (
    <li className="listed-items-info">
     <div className="product-image-holder">
        <img className="product-image" src={product.imageurl} alt="item-image" />
      </div>
      <h5 className="listed-item-model">{product.brand}</h5>
      <p className="listed-item-desc">{product.description}</p>
      <p className="listed-item-desc">{product.color}</p>
      <div className="price-sellbtn">
        <span className="listed-item-price">$ {product.price}</span>
        <span className="lister-item-price">buy it</span>
      </div>
    </li>
  );
};
