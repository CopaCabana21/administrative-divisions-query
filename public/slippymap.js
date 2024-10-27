
var geojsonLayer;
let highlightedLayer = null;


/* create one information panel and attach methods */

var info = L.control();
info.onAdd = function(map){
        
    this.div = L.DomUtil.create('div', 'info');
    this.div.innerHTML = "";
    
    return this.div;
}

info.updatePanel = function(tags){

    let rows = "";
    let tagsToUse = ["admin_level", "name", "population", "population:date", "wikipedia", "wikidata"];

    const filteredTags = Object.keys(tags).filter(ele => tagsToUse.includes(ele));

    for (const key of filteredTags) {
        
        let datacell;

        switch (key) {
            case "wikipedia":
                datacell = `<td><a href="https://en.wikipedia.org/wiki/${tags[key]}">${tags[key]}</a></td>`;
                break;
            case "wikidata":
                datacell = `<td><a href="https://www.wikidata.org/wiki/${tags[key]}">${tags[key]}</a></td>`;
                break;
            default:
                datacell = `<td>${tags[key]}</td>`;
                break;
        }

        let row = `<tr style="font-size: 0.9em">
            <th>${key}</th>
            ${datacell}
        </tr>`
        
        rows += row;
    }

    info.div.innerHTML = 
    `<table class = "mb-0 table" >
        <tbody>
            ${rows}
        </tbody>
    </table>`;
}

/* make main creation of map function */

function makeSlippyMap(osmData, map){

    /* once we have the relation (promise resolved), convert to geojson  */
    /* Use a deep copy */
    var geojsonData = osmtogeojson(JSON.parse(JSON.stringify(osmData)));
    /* and make the layer */
    geojsonLayer = L.geoJSON(geojsonData, {
        filter: function(feature, layer){
            return !(feature.id.includes('node'));
        },
        /* add tooltip */
        onEachFeature: onEachFuture,
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

    /* clean information panel */
    info.addTo(map);
    info.div.innerHTML = "";

    /* add all layers */
    layer.addTo(map);
    geojsonLayer.addTo(map);

}


function highlightFeature(event){

    // highlight feature in layer
    let layer = event.target;
    
    if (highlightedLayer) {
        geojsonLayer.resetStyle(highlightedLayer);
    }
    
    layer.setStyle({
        color: "red"
    });

    layer.bringToFront();
    highlightedLayer = layer;
    
    // update info panel
    let tags = layer.feature.properties;

    info.updatePanel(tags);

}

/* tooltip function */
function onEachFuture(feature, layer){

    layer.bindTooltip(
        `<span 
            class="custom-bindPopup" 
            href="https://www.openstreetmap.org/relation/${feature.properties.id.replace("relation/","")}">
             ${feature.properties.name} (${feature.properties.id.replace("relation/","")})
        </span>`
    );

    layer.on({
        // e is the event and this is the layer
        // the layer created with each applied feature
        'mouseover' : function (e) {
            this.openTooltip();
        },
        "click" : highlightFeature
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

export {makeSlippyMap, showSlippyAlert}