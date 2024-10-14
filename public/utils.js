/* get relation from OSM API */
async function getRelation(relationID, out = "geom") {
    var endPoint = "https://overpass-api.de/api/interpreter";

    // to accept an array
    let idsArray = ((typeof relationID) == "number")? [relationID] : relationID;

    let query = `
    [out:json][timeout:90];
    rel(id:${idsArray.join(",")});
    out ${out};
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

function makeOSMDataIndex(osmRaw){

    let tagsIndex = {};
    osmRaw.elements.forEach(ele => {
        tagsIndex[ele.id] = {bounds: ele.bounds, members: ele.members, tags: ele.tags};
    });

    return tagsIndex;
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

    /* add events to list element results */
    newElement.addEventListener("click", function(eve){
        // show busy icon
        document.getElementById("busyIcon").style.visibility = "visible";

        getRelation(element.osm_id)
            .then(x => {
                // hide busy icon
                document.getElementById("busyIcon").style.visibility = "hidden";
                // resolved promise with the value x
                return x;
            })
            .then(x => {
                // remove previous results info
                removeRelationsInfo();
                // add slippy map
                makeSlippyMap(x, map);
                // add tag table
                makeOSMTagTableElement(element.display_name, x.elements[0].tags);
            })
            .catch(err => {
                // hide busy icon
                document.getElementById("busyIcon").style.visibility = "hidden";
                // show alert
                showSlippyAlert(err);
            });
    });
}

/* remove results from search */
function removeListElements(){

    // remove elements from list selector
    let parent = document.getElementById("listSelector");

    [...parent.children].forEach(ele => {
        if(ele.id != "listSelector-busyIcon-container"){
            ele.parentNode.removeChild(ele);
            // console.log(ele);
        }
    });
}

/* remove tables and other info of elements */
function removeRelationsInfo(){
    // remove relations info
    document.getElementById("relations-info").innerHTML = "";
}


/* tooltip function */
function featureTooltip(feature, layer, map){

    let tooltip = layer.bindTooltip(
        `<span 
            class="custom-bindPopup" 
            href="https://www.openstreetmap.org/relation/${feature.properties.id.replace("relation/","")}">
             ${feature.properties.name} (${feature.properties.id.replace("relation/","")})
        </span>`
    );

    tooltip.on('mouseover', function (e) {
        this.openTooltip();
    });


}

function makeSlippyMap(osmData, map){

    /* once we have the relation (promise resolved), convert to geojson  */
    /* Use a deep copy */
    var geojsonData = osmtogeojson(JSON.parse(JSON.stringify(osmData)));
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

/* Make table of tags  */
function makeOSMTagTableElement(elemName, osmTags){

    /* table from OSM */
    const osmTable = document.createElement("div");
    // container for tag table
    osmTable.setAttribute("class", "tagTable-cont mx-1 my-3 border border-secondary-subtle rounded overflow-hidden bg-dark");

    // make table elements
    let trElements = ``;
    for( const [key, val] of Object.entries(osmTags)){
        trElements += `<tr>
            <th class="border-secondary-subtle table-secondary" dir="auto">${key}</th>
            <td class="border-secondary-subtle border-start text-break" dir="ltr">${val}</td>
        </tr>`
    }

    // use title from nominatim
    let elemSourceTitle =`<h5 class="mx-2 my-1 text-light">OSM tags</h5>`;
    let tableInnerHTML = elemSourceTitle + `<table class="mb-0 table"><tbody>` + trElements + `</tbody></table>`;
    osmTable.innerHTML = tableInnerHTML;


    /* relation container */
    // make container and title
    const relInfoCont = document.createElement("div");
    relInfoCont.setAttribute("class", "rel-info-container my-4");

    const relInfoContTitle = `<h4 class="mx-2 my-1 text-dark border-bottom border-dark arrowHead expanded">${elemName}</h4>`
    relInfoCont.innerHTML = relInfoContTitle;
    relInfoCont.appendChild(osmTable)

    relInfoCont.querySelector("h4").addEventListener("click", function(){
        relInfoCont.querySelector(osmTable.classList.toggle("hide"));
        relInfoCont.querySelector("h4").classList.toggle("expanded");
    });

    // removeListElements();
    document.getElementById("relations-info").appendChild(relInfoCont);
}


function makeOSMIdsSlippyMap(OSMIds, map){
    /* hide alerts */
    document.querySelector("#elementsDisplay div.alert").style.visibility = "hidden";
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

/* build tree: another way to get the json structure from flattened get_selected*/
function buildTree(nodes, key, parentId = "#"){
    
    let tree = nodes.filter(node => node[key] == parentId);

    tree = tree.map(node => {
        let newNode = {...node, children: buildTree(nodes, key, node.id)};
        delete newNode._parent;
        return newNode;
    });
    return tree;
}

function flattenTree(tree, key, selecteParentID = "#"){
    
    const getIDs = function(list){
        return list.map(ele => ele.id);
    }

    let flattened = [];

    tree.forEach(node => {
        flattened.push({...node, _parent: selecteParentID, [key]:getIDs(node[key])});
        flattened = flattened.concat(flattenTree(node[key], key, node.id));
    })

    return flattened;
}

function traverseTree(tree, func, key){
    if(tree == []) return [];

    let appliedNode =  tree.map(node => {
        traverseTree(node[key], func, key);
        return func(node);
    });

    return appliedNode;
}

export {getRelation, makeOSMDataIndex, getNominatimSearch, addListElement, makeSlippyMap, makeOSMIdsSlippyMap, removeListElements, flattenTree, buildTree};