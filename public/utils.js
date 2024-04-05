
/* get relation from OSM API */
async function getRelation(relationID) {
    var endPoint = "https://overpass-api.de/api/interpreter";

    let query = `
    [out:json][timeout:90];
    rel(${relationID});
    out geom;
    `

    try{
        let response = await fetch(endPoint, {method: "POST", body: ("data=" + encodeURIComponent(query))});
        if(!response.ok){
            throw new Error('Network response was not ok')
        }

        let data = await response.json();
        return data;
    }catch (error){

        console.log("Error fetching data: ", error);
        throw error; /* re-throw error */
    }

}

/* get result from nominatim search engine */
async function getNominatimSearch(query){

    const params = {
        country : encodeURIComponent(query),
        format : 'jsonv2'
    }

    const apiURL = `https://nominatim.openstreetmap.org/search?${(new URLSearchParams(params)).toString()}`;

    /* make api call and handle response */
    // console.log(apiURL);

    /* only once the promise is succesfully resolved the searchResult will have value instead of undefined */
    var searchResult = await fetch(apiURL)
        .then(resp => {
            return resp.ok ? resp.json() : Promise.reject(new Error("Bad network response"));
        })
        .catch(err => {
            // console.log('Error fetching data', err);
            return Promise.reject(new Error(err));
        });

    return searchResult;
}


/* create and add list element */
function addListElement(content){

    /* make element */
    let innerHTML = `<a href="#">${content[0] + " (" + content[1] + ")"}</a>`;
    const newElement = document.createElement("li");
    
    newElement.innerHTML = innerHTML;
    document.getElementById('listSelector').appendChild(newElement);

    /* add event */
    newElement.addEventListener("click", function(eve){
        // console.log(content[1]);
        getRelation(content[1]).then(x => makeSlippyMap(x));
    });
}

/* var lexical scope is outside the function */
var map;

function makeSlippyMap(osmData){
    /* once we have the relation (promise resolved), convert to geojson and make the layer */
    let geojsonData = osmtogeojson(osmData);
    var geojsonLayer = L.geoJSON(geojsonData, {
        filter: function(feature, layer){
            return !(feature.id.includes('node'));
        }
    });

    /* first get bounds of the content and set that as bounds */
    /* check if map is already initialized in the same container. The lexical scope of var is outside so it doesn't create a new var each time */
    if(map != undefined) map.remove(); 
    map = L.map('myMap');
    map.fitBounds(geojsonLayer.getBounds());
    
    /* make tiles layer */
    var layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 15,
        /* osm copyright */
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    /* add all layers */
    layer.addTo(map);
    geojsonLayer.addTo(map);

}



export {getRelation, getNominatimSearch, addListElement, makeSlippyMap};