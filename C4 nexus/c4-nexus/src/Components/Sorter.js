export const Sorter = ({
    click,
    onClickHandler,
    onAlphabetDown,
    onAlphabetUp,
    onPriceAcending,
    onPriceDecending
}) => (
    <div class="sort">
        <div class="category-info">
            <h3 class="category-info-title"> <span class="category-title-name">List category:</span></h3>
            <p class="category-description">  witch witch can going true all products </p>
        </div>
        <div class="dropdown-sort">
            <button onClick={(e) => onClickHandler(e.target)} name="sort" class="dropbtn-sort">Sort</button>
            <div id="myDropdown" className={`dropdown-content ${click.sort ? "visible" : ""}`} class="dropdown-content">
                <a onClick={onAlphabetDown}>Alphabetical a-z</a>
                <a onClick={onAlphabetUp}>Alphabetical z-a</a>
                <a onClick={onPriceAcending}>Price ascending.</a>
                <a onClick={onPriceDecending}>Price descending.</a>
            </div>
        </div>
    </div>
)