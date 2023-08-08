export const Filter = ({
    click,
    onClickHandler
}) => (
    <div className="filter-section .drop-down">
        <div className="dropdown" onClick={(e) => onClickHandler(e.target)}>
            <button name="filter" className={`dropbtn`}>Filter</button>

            <div id="myDropdown" className={`dropdown-content ${click.filter ? "visible" : ""}`}>
                <a value={click.color} name="color" >Color</a>
                <ul className={`colors-list ${click.color === true ? "visible" : ""}`} >
                    <li >
                        <input type="radio" id="black" name="black" value={"black"} checked={click.black} /> Black
                    </li>
                    <li>
                        <input type="radio" id="white" name="white" value={"white"} checked={click.white} /> White
                    </li>
                </ul>
                <a name="price" value={click.price} >Price</a>
                <ul className={`price-list ${click.price ? "visible" : click.price = false}`}>
                    <li >
                        <input type="radio" value={1000} name="1000" checked={click.range1000}  /> $0-1000$
                    </li>
                    <li>
                        <input type="radio" value={2000} name="2000" checked={click.range2000}/> $1000-2000$
                    </li>
                </ul>
            </div>
        </div>


    </div>
)