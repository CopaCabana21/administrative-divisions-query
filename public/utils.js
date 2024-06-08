/* get relation from OSM API */
async function getRelation(relationID) {
    var endPoint = "https://overpass-api.de/api/interpreter";

    // to accept an array
    let idsArray = ((typeof relationID) == "number")? [relationID] : relationID;

    let query = `
    [out:json][timeout:90];
    rel(id:${idsArray.join(",")});
    out geom;
    `;

    let response = await fetch(endPoint, {method: "POST", body: ("data=" + encodeURIComponent(query))});

    if(!response.ok){
        /* a not ok response doesn't throw an error, so throw one and add the response object */
        throw new Error("Fetch response was not ok", {cause: response});
    }

    let osmRes = await response.json();

    if(osmRes.elements.length === 0){
        throw new Error("Fetch response has empty elements");
    }

    return osmRes;
}

/* get result from nominatim search engine */
async function getNominatimSearch(query){

    /* display busy icon */
    document.getElementById("listSelector-busyIcon").style.display = "block";

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
    document.getElementById("listSelector-busyIcon").style.display = "none";

    return searchResult;
}

// let temp = new Error("Bad network response");
// console.dir(temp.keys);

/* create and add list element */
function addListElement(element, map){
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

        getRelation(element.osm_id)
            .then(x => {
                /* hide busy icon */
                document.getElementById("busyIcon").style.visibility = "hidden";
                // resolved promise with the value x
                return x;
            })
            .then(x => {
                makeSlippyMap(x, map);
                makeOSMTagTableElement(x.elements[0].tags);
            })
            .catch(err => {
                /* hide busy icon */
                document.getElementById("busyIcon").style.visibility = "hidden";
                /* show alert */
                showSlippyAlert(err);
            });
    });
}

function removeListElements(){
    let parent = document.getElementById("listSelector");

    [...parent.children].forEach(ele => {
        if(ele.id != "listSelector-busyIcon-container"){
            ele.parentNode.removeChild(ele);
            // console.log(ele);
        }
    });
}



/* tooltip function */
function featureTooltip(feature, layer){
    layer.bindTooltip(`${feature.properties.name} (${feature.properties.id.replace("relation/","")})`);

    /* add click event */
    layer.on("click", function(){
        layer.openTooltip();
    });

}

function makeSlippyMap(osmData, map){

    /* once we have the relation (promise resolved), convert to geojson  */
    var geojsonData = osmtogeojson(osmData);
    /* and make the layer */
    var geojsonLayer = L.geoJSON(geojsonData, {
        filter: function(feature, layer){
            return !(feature.id.includes('node'));
        },
        /* add tooltip */
        onEachFeature: featureTooltip
    });


    
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


function makeOSMTagTableElement(osmTags){
    const newElement = document.createElement("div");
    newElement.setAttribute("class", "mx-1 mb-3 border border-secondary-subtle rounded overflow-hidden border");
    newElement.setAttribute("id", "tagTableWrapper");

    let trElements = ``;
    for( const [key, val] of Object.entries(osmTags)){
        trElements += `<tr>
            <th class="border-secondary-subtle table-secondary" dir="auto">${key}</th>
            <td class="border-secondary-subtle border-start text-break" dir="ltr">${val}</td>
        </tr>`
    }

    let tableInnerHTML = `<table class="mb-0 table"><tbody>` + trElements + `</tbody></table>`;
    newElement.innerHTML = tableInnerHTML;

    removeListElements();
    document.getElementById("listSelector").appendChild(newElement);

    // document.getElementById('tagTableWrapper').insertAdjacentHTML("beforeend", tableInnerHTML);
}


function makeOSMIdsSlippyMap(OSMIds, map){
    /* show busy icon */
    document.getElementById("busyIcon").style.visibility = "visible";

    getRelation(OSMIds)
        .then(osmData => {
            makeSlippyMap(osmData, map);
        })
        .catch(err => {
            /* show alert */
            showSlippyAlert(err);
        });
}

function showSlippyAlert(err){

    /* hide busy icon */
    document.getElementById("busyIcon").style.visibility = "hidden";  

    if(err.cause){
        document.querySelector("#elementsDisplay div.alert p").textContent =`${err.message}:\n ${err.cause.status} - ${err.cause.statusText}`;
    }else{
        document.querySelector("#elementsDisplay div.alert p").textContent = `${err.message}`;
    };

    /* display alert */
    document.querySelector("#elementsDisplay div.alert").style.visibility = "visible";
}


export {getRelation, getNominatimSearch, addListElement, makeSlippyMap, makeOSMIdsSlippyMap, removeListElements};