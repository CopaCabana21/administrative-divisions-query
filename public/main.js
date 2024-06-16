import {getNominatimSearch, addListElement, makeOSMIdsSlippyMap, removeListElements} from './utils.js';
import './bundle.js';

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

/* handle search form */
document.getElementById('countrySearchForm').addEventListener("submit", function(event){
    /* prevents the default behaviour of the form */
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

//! ----------------------------------------------------------------------------
//! old way to handle add selection height
// document.querySelectorAll("#addSelection .collapsible").forEach(ele => ele.addEventListener("click", function(){
    
//     let content = this.nextElementSibling.nextElementSibling;
//     let parent = content.parentElement.closest(".content");

//     this.classList.toggle("arrow-down");

//     /* this style.maxHeight = "value" will add on top of the base css "max-height: 0;"
//     Once it is removed the normal css "max-height: 0;" will apply */
//     if(content.style.maxHeight){
//         content.style.maxHeight = null;
//         while(parent){
//             parent.style.maxHeight = parent.scrollHeight - content.scrollHeight + "px";
//             parent = parent.parentElement.closest(".content");
//         }
//     }else{
//         content.style.maxHeight = content.scrollHeight + "px";
//         while(parent){
//             parent.style.maxHeight = parent.scrollHeight + content.scrollHeight + "px";
//             parent = parent.parentElement.closest(".content");
//         }
//     }
// }))
//! ----------------------------------------------------------------------------

// TODO: -----------------------------------------------------------------------
// TODO: make a jstree plugin to add button later, it is taking me too much time, use customMenu instead

// (function($, undefined){
//     "use strict";
//     $.jstree.defaults.dotsMenu = {
//         dotsMenu_option : "sample",
//     };
    
//     /* define the actual plugin */
//     $.jstree.plugins.dotsMenu = function(options, parent){

//         this.redraw_node = function(obj, deep, callback, force_draw){
//             obj = parent.redraw_node.call(this, obj, deep, callback, force_draw);

//             if(obj){
//                 var $button = $('<button class="custom-btn">Click Me</button>');
//                 $(obj).append($button);

//                 $button.on('click', function(event) {
//                     event.stopPropagation();
//                     console.log('Button clicked for node: ' + $(obj).attr('id'));
//                 });
//             }

//             return obj;
//         };
//     };
// })(jQuery);
// TODO: -----------------------------------------------------------------------



/* Make and handle jstree */
$("#addSelectionTree").jstree({
    "core": {
        'themes': {
            'icons': false
          },
        "dblclick_toggle": false,
        "check_callback": false
    },
    "plugins": ["checkbox", 'wholerow', "search", "contextmenu"],
    "checkbox": {
        "three_state": false,
        // "cascade": "down",
        "whole_node": false,
    },
    "search": {
        "show_only_matches": true
    },
    "contextmenu":{
        "items": function(node){
            return {
                "immediateChilds": {
                    "label": "select immediate childs",
                    /* obj is the button object */
                    "action": function(obj){
                        // console.log(node);
                        // console.log(obj);
                        /* select only immediate children */
                        node.children.forEach( child =>{
                            $(node).jstree("select_node", child, true);
                        });
                    }
                },
                "allChilds": {
                    "label": "select all childs",
                    "action": function(obj){
                        node.children_d.forEach( child =>{
                            $(node).jstree("select_node", child, true);
                        });
                    }
                }
            }
        }
    }
});

$("#addSelectionFilter").on("input", function(){
    $("#addSelectionTree").jstree(true).search($(this).val());
});

$("#addSelectionReset").on("click", function(){
    // $("#addSelectionFilter").val("").trigger("change").focus();
    $("#addSelectionTree").jstree(true).deselect_all();
})


$("#addSelectionPlot").on("click", function(e){
    let selected = $("#addSelectionTree").jstree(true).get_selected();
    selected.forEach((ele, index, arr)=>{
        arr[index] = ele.replace("osm-rel-","");
    });
    /* plot slippy map for selected relations */
    makeOSMIdsSlippyMap(selected, map);
})


//! -----------------------------------------------
//! old way of selection immediate childs
/* only the immediate children should be selected */
/* This uses cascade down checkbox */
// $("#addSelectionTree").on("select_node.jstree", function(e, data){

//     // console.log(data.node);
//     let children = data.node.children;
//     /* complement from all children */
//     let childrenDeselect = data.node.children_d.filter(x => !children.includes(x));
//     /* true, disable changed.jstree event */
//     childrenDeselect.forEach( child =>{
//         $(this).jstree("deselect_node", child, true);
//     });

// })
//! -----------------------------------------------


/* -------------------------------------------------------------------------- */
/* Handle download of selected tree */

/* make the popup menu show up */
$("#addSelectionDownloadPopupMenu").on("click", function(){
    $(".m-popup").toggleClass("show");
    $(".m-popup-background").toggleClass("show");
});

/* click outside to close menu */
$(".m-popup-background").on("click",function(){
    $(".m-popup").toggleClass("show");
    $(".m-popup-background").toggleClass("show");
})

/* make download feature */
function popupMenuDownload(dlStruct, dlFormat, dlIncludeData){

    let jstreeData;
    if(dlStruct.id == "download-structure-tree"){

        jstreeData = $("#addSelectionTree").jstree(true).get_json();
        jstreeData = filterSelectedArray(jstreeData);
    }else if(dlStruct.id == "download-structure-nodes"){

        jstreeData = $("#addSelectionTree").jstree(true).get_selected(true);
        jstreeData = jstreeData.map(node => formatNode(node));
        // jstreeData = buildTree(jstreeData);
    }
    
    const xml = mlib.json2xml(jstreeData, { compact: true, spaces: 4 });
    console.log(xml);
    /* the get_json returns the whole tree, so filter only the selected nodes */
    jstreeData = JSON.stringify(jstreeData, null, 2);

    /* trigger anchor element to download */
    // donwload(selectedStructure, 'selected_elements.json', 'application/json')


};

/* Give each element an specific format */
function formatNode(node){

    return (({id, text, parent, children})=>({
        id: id.replace("osm-rel-",""),
        name: text.replace(/\n/gi, "").trim(),
        parent: parent.replace("osm-rel-",""),
        children: children.every(ele => typeof ele == "string")? children.map(id => id.replace("osm-rel-","")) : children
        })
    )(node);
}

/* Use recursive function to filter only selected elements */
function filterSelectedArray(selectedArray, parentId ="#"){

    let filteredArray = [];
    let formattedElem;
    selectedArray.map(function(ele){
        if(ele.state.selected == true){
            formattedElem = formatNode({...ele, parent: parentId, children: filterSelectedArray(ele.children, ele.id)});
            filteredArray.push(formattedElem);
        }else{
            filteredArray = [...filteredArray, ...filterSelectedArray(ele.children, ele.id)];
        }
    });

    return filteredArray;
}

/* build tree: another way to get the json structure from flattened get_selected*/
function buildTree(selected, parentId = "#"){

    let tree = selected.filter(node => node.parent == parentId);
    tree = tree.map(node => ({...node, children: buildTree(selected, node.id)}));
    return tree;
}

/* handle the download with anchor element */
function donwload(content, filename, contentType){
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    /* createObjectURL makes the file available in disk to use as href */
    a.href = URL.createObjectURL(file);
    a.download = filename;

    /* wait and then revoke the object */
    a.addEventListener("click", function(){
        setTimeout(()=>URL.revokeObjectURL(a.href), 200);
    });
    a.click();
}


/* handle form behaviour */
document.getElementById("form-download-structure").addEventListener("submit", handleSelectionDownload);

function handleSelectionDownload(event){
    event.preventDefault();
    let dlStruct = document.querySelector(".download-structure input:checked");
    let dlFormat = document.querySelector(".download-format input:checked");
    let dlIncludeData = document.querySelector(".download-include-data input:checked");

    popupMenuDownload(dlStruct, dlFormat, dlIncludeData);   
}

/* -------------------------------------------------------------------------- */
