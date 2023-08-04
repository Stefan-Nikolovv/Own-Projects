

export const Create = () => {
    return (
        <div class="edit-car-page">
        <h1 class="add-car-title">
          create car
        </h1>
        <div class="personal-details">
            <p class="personal-details-form">Personal details</p>
            <form class="add-car-personal-info">
                <label for="pnumber">Name</label>
                <input type="text" id="Pname" name="Pname"/>
                <label for="city">City</label>
                <input type="text" id="city" name="city"/>
                 <label for="country">Country</label>
                <input type="text" id="country" name="country"/>
                <label for="pcode">Phone number</label>
                <input type="text" id="pNumber" name="pNumber"/>
            </form>
        </div>
        <div class="car-details">
            <p class="car-details-form">Car Details</p>
            <form class="add-car-desc">
                <label for="brand">brand</label>
                <input type="text" id="brand" name="brand"/>
                <label for="model">model</label>
                <input type="text" id="model" name="model"/>
                <label for="year">year</label>
                <input type="text" id="year" name="year"/>
                <label for="imageUrl">image url</label>
                <input type="text" id="imageUrl" name="imageUrl"/>
                <label for="price">price</label>
                <input type="text" id="price" name="price"/>
                <label for="description">description</label>
                <input type="text" id="description" name="description"/>
            </form>
        </div>
        <button class="submit-car">
            Submit
        </button>
    </div>
        );
};