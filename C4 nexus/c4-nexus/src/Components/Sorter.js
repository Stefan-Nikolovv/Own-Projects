export const Sorter = ({
    click,
    onClickHandler,
    onAlphabetDown,
    onAlphabetUp,
    onPriceAcending,
    onPriceDecending
}) => (
    <div class="sort">
        <div className="category-info">
            <h3 className="category-info-title"> <span className="category-title-name">List category:</span></h3>
            <p className="category-description">  witch witch can going true all products </p>
        </div>
        <div className="dropdown-sort">
            <button onClick={(e) => onClickHandler(e.target)} name="sort" className="dropbtn-sort">Sort</button>
            <div id="myDropdown" className={`dropdown-content ${click.sort ? "visible" : ""}`}>
                <a onClick={onAlphabetDown}>Alphabetical a-z</a>
                <a onClick={onAlphabetUp}>Alphabetical z-a</a>
                <a onClick={onPriceAcending}>Price ascending.</a>
                <a onClick={onPriceDecending}>Price descending.</a>
            </div>
        </div>
    </div>
)