import {getRelation, getNominatimSearch, addListElement, makeOSMIdsSlippyMap, removeListElements} from './utils.js';

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


document.querySelectorAll("#addSelection .collapsible").forEach(ele => ele.addEventListener("click", function(){
    
    let content = this.nextElementSibling.nextElementSibling;
    let parent = content.parentElement.closest(".content");

    this.classList.toggle("arrow-down");

    /* this style.maxHeight = "value" will add on top of the base css "max-height: 0;"
    Once it is removed the normal css "max-height: 0;" will apply */
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

/**
 *TODO: make a jstree plugin to add button later, it is taking me too much time, use customMenu instead
  */
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
