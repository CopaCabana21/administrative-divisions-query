import {getRelation, getNominatimSearch, addListElement, makeSlippyMap} from './utils.js';

getRelation(288247).then(res => makeSlippyMap(res));

/* handle search form */
document.getElementById('countrySearchForm').addEventListener("submit", function(event){
    event.preventDefault();
    const searchQuery = document.querySelector('#countrySearchForm > input').value;

    getNominatimSearch(searchQuery).then(res =>{
        let searchData = res.map(x => [x.name, x.osm_id]);
        // console.log(searchData);

        /* remove previous search elements */
        document.getElementById('listSelector').innerHTML = '';

        /* populate unordered list */
        searchData.forEach(element => {
            addListElement(element);
        });
    });


});