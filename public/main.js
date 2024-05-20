import {getRelation, getNominatimSearch, addListElement, makeSlippyMap, removeListElements} from './utils.js';

// var input = document.querySelector("input");
// input.setAttribute('size',input.getAttribute('placeholder').length);

/* Initialize map and set to world */
/* leaflet adds the class leaflet-container to the element */
const map = L.map('myMap').setView([0,0], 1);
const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 15,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

layer.addTo(map);

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
                addListElement(element, map);
            });
        })
        .catch(err => {
            console.log('Error fetching data', err);
        });


});


document.querySelectorAll("#addSelection .collapsible").forEach(ele => ele.addEventListener("click", function(){
    
    let content = this.nextElementSibling.nextElementSibling;
    let parent = content.parentElement.closest(".content");

    this.classList.toggle("arrow-down");

    // this style.maxHeight = "value" will add on top of the base css "max-height: 0;"
    // Once it is removed the normal css "max-height: 0;" will apply
    if(content.style.maxHeight){
        content.style.maxHeight = null;
        while(parent){
            parent.style.maxHeight = parent.scrollHeight - content.scrollHeight + "px";
            parent = parent.parentElement.closest(".content");
        }
    }else{
        content.style.maxHeight = content.scrollHeight + "px";
        while(parent){
            parent.style.maxHeight = parent.scrollHeight + content.scrollHeight + "px";
            parent = parent.parentElement.closest(".content");
        }
    }

}))

