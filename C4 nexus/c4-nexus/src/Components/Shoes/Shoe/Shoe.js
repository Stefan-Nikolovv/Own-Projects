export const Shoe = ({ product }) => {
  return (
    <li class="listed-items-info">
     <div class="product-image-holder">
        <img class="product-image" src={product.imageurl} alt="item-image" />
      </div>
      <h5 class="listed-item-model">{product.brand}</h5>
      <p class="listed-item-desc">{product.description}</p>
      <p class="listed-item-desc">{product.color}</p>
      <div class="price-sellbtn">
        <span class="listed-item-price">$ {product.price}</span>
        <span class="lister-item-price">buy it</span>
      </div>
    </li>
  );
};
