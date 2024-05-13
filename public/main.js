import {getRelation, getNominatimSearch, addListElement, makeSlippyMap, removeListElements} from './utils.js';

/* test relation */
// getRelation(288247).then(res => makeSlippyMap(res));

/* handle search form */
document.getElementById('countrySearchForm').addEventListener("submit", function(event){
    event.preventDefault();
    const searchQuery = document.querySelector('#countrySearchForm > input').value;

    /* remove previous search elements */
    removeListElements();

    getNominatimSearch(searchQuery)
        .then(res =>{
            //! /* pass only the name and id */
            //! let searchData = res.map(x => [x.name, x.osm_id]);

            // document.getElementById('listSelector').innerHTML = '';
            /* filter res */
            let resFilter = res.filter(ele => ele.osm_type == "relation");

            /* populate unordered list */
            resFilter.forEach(element => {
                addListElement(element);
            });
        })
        .catch(err => {
            console.log('Error fetching data', err);
        });


});