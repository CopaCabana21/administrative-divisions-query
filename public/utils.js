/* get relation from OSM API */
async function getRelation(relationID) {
    var endPoint = "https://overpass-api.de/api/interpreter";

    let query = `
    [out:json][timeout:90];
    rel(${relationID});
    out geom;
    `;

    try{

        let response = await fetch(endPoint, {method: "POST", body: ("data=" + encodeURIComponent(query))});

        console.log(response);
        if(!response.ok){
            /* a not ok response doesn't throw an error, so throw one and add the response object */
            throw new Error("Feth response was not ok", {cause: response});
        }

        let data = await response.json();
        return data;
    }catch (error){
        // console.log("Error fetching data: ", error);
        /* re-throw error */
        throw error; 
    }
}

/* get result from nominatim search engine */
async function getNominatimSearch(query){
    /* display busy icon */
    document.getElementById("listSelector-busyIcon").style.visibility = "visible";

    /* this are the parameters for the structured query */
    const params = {
        country : encodeURIComponent(query),
        format : 'jsonv2'
    }
    // const apiQueryURL = `https://nominatim.openstreetmap.org/search?${(new URLSearchParams(params)).toString()}`;
    const apiQueryURL = `https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2`;

    /* make api call and handle response */
    /* only once the promise is succesfully resolved the searchResult will have value instead of undefined */
    var searchResult = await fetch(apiQueryURL)
        .then(resp => {
            // console.log("H1", resp);
            // resp.json().then(x=>console.log("H3", JSON.stringify(x)));
            // resp.json().then(x=>console.log("H3", x));
            return resp.ok ? resp.json() : Promise.reject(new Error("Bad network response"));
        })
        .catch(err => {
            // console.log("H");
            // console.log('Error fetching data', err);
            return Promise.reject(new Error(err));
        });
        
    /* hide busy icon */
    document.getElementById("listSelector-busyIcon").style.visibility = "hidden";

    return searchResult;
}

// let temp = new Error("Bad network response");
// console.dir(temp.keys);

/* create and add list element */
function addListElement(element){
    /* make element using innerHTML */
    let innerHTML = `<a href="#" class="list-group-item list-group-item-action">${element.name} (${element.addresstype}-${element.osm_id})</a>`;
    // const newElement = document.createElement("a");
    // newElement.innerHTML = innerHTML;

    /* make element using DOMParser */
    let newElement = (new DOMParser()).parseFromString(
        `<a href="#" class="list-group-item list-group-item-action">
            ${element.display_name} <span style="color:black;">(${element.addresstype}-${element.osm_type}:${element.osm_id})</span>
        </a>`,
         "text/html"
    );
    newElement = newElement.documentElement.querySelector("a");

    /* add element */
    document.getElementById('listSelector').appendChild(newElement);

    /* add event to element */
    newElement.addEventListener("click", function(eve){
        /* show busy icon */
        document.getElementById("busyIcon").style.visibility = "visible";

        getRelation(element)
            .then(x => {
                /* hide busy icon */
                document.getElementById("busyIcon").style.visibility = "hidden";
                return x;
            })
            .then(x => makeSlippyMap(x, map))
            .catch(err => console.log("Error fetching relation: ", err.message, `: ${err.cause.status}-${err.cause.statusText}`));
    });
}

//! /* var lexical scope is outside the function */
//! // var map;

function makeSlippyMap(osmData){
    /* once we have the relation (promise resolved), convert to geojson and make the layer */
    var geojsonData = osmtogeojson(osmData);
    var geojsonLayer = L.geoJSON(geojsonData, {
        filter: function(feature, layer){
            return !(feature.id.includes('node'));
        }
    });

    /* first get bounds of the content and set that as bounds */
    /* check if map is already initialized in the same container. The lexical scope of var is outside so it doesn't create a new var each time */
    
    //! /*
    //! this was a check using the variable, which was global scope of utils.js.
    //! Instead i'm using the window object to attach the property, lol
    //! */
    //! if(map != undefined) map.remove();

    /* remove previous layers */
    map.eachLayer(function (layer) {
        map.removeLayer(layer);
    });

    /* fit bounds to new layer */
    map.fitBounds(geojsonLayer.getBounds());
    
    /* make tiles layer */
    var layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 15,
        /* osm copyright */
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    /* hide busy icon */
    document.getElementById("busyIcon").style.visibility = "hidden";

    /* add all layers */
    layer.addTo(map);
    geojsonLayer.addTo(map);

}


export {getRelation, getNominatimSearch, addListElement, makeSlippyMap};