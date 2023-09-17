// Libraries
const JSZip = require("jszip"); // Used for zipping/unzipping in-memory on client-side
const initSqlJs = require("sql.js"); // Used to read and update anki files in-memory on client-side
const anki = require("./anki_handling.js");

// Global variable to use across multiple methods and states
var zip; // Used to store all items from the anki zip file
var anki_db; // Used to store anki db objects (decks, cards, notes, etc.)
var current_website_state; // Used to keep track of which part of the website is currently used
var checked_columns = [];
var anki_decks = {};
var deck_graph = "";
var anki_models = {};
var deck_to_model_route = {};

// Unzips the given anki file
function unzipFile(inputZipFile, callback){
    // Create a new instance of the zip object
    zip = new JSZip();
  
    // Use the FileReader API to read the contents of the inputZipFile
    var reader = new FileReader();
    reader.onload = function(event){
      // Add the contents of the file to the zip object
        zip.loadAsync(event.target.result).then(function(zip) {
        // List all the files in the zip object
        zip.forEach(function (relativePath, zipEntry) {
            if (relativePath == "collection.anki21") {
                zipEntry.async("uint8array").then(function (fileData) {
                    console.log(new TextDecoder().decode(fileData));
                    callback(fileData);
                  });
            }
        });
      });
    };
  
    // Read the inputZipFile as an arraybuffer
    reader.readAsArrayBuffer(inputZipFile);
}

// Processes anki db objects in-memory for further use
window.process_anki_db = function(anki_file) {
    console.log(anki_file);

    // Apkg is a zip file that has 2 db files and a folder for media (.anki21 is the one we need)
    unzipFile(anki_file, async function(fileData) {
        if (fileData) {
            const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
            console.log("here");
            // Create db with user anki21 file as arraybuffer
            anki_db = new SQL.Database(fileData);
            console.log(anki_db);

            // Reset some variables that persist db data in case of new upload
            deck_graph = "";
            anki_models = {};
            checked_columns = [];
            anki_decks = {};
            deck_to_model_route = {};
        }
    
    });

}

window.get_html_deck_graph = function() {

    // No need to recalculate deck graph if it was already done before
    if (deck_graph != "") {
        return deck_graph;
    }

    anki_decks = anki.get_decks(anki_db);
    anki_models = anki.get_models(anki_db);
    deck_to_model_route = anki.get_deck_to_model_route(anki_db);

    console.log("HEYHEYHEY");
    console.log(anki_decks);
    console.log(anki_models);
    console.log(deck_to_model_route);


    // Create html string
    let html_deck_graph = '<div class="content_box"><ul class="tree">';
    
    for (let sub_item_name in anki_decks) {
        
        html_deck_graph += '<li><div><input type="checkbox" onclick="handle_deck_click(this)" id="checkbox' + anki_decks[sub_item_name].id + '" name="' + sub_item_name + '">' + sub_item_name + '</div>';
        console.log(111);
        console.log(anki_decks[sub_item_name]);
        console.log(Object.keys(anki_decks[sub_item_name].sub_decks).length);
        if (Object.keys(anki_decks[sub_item_name].sub_decks).length > 0) {
            html_deck_graph = recursive_html_create(anki_decks[sub_item_name].sub_decks, html_deck_graph);     
        } 
    }
    html_deck_graph += "</ul></div>";
    return html_deck_graph;
}

// Used in create_html_from_json for recursive graph traversal
function recursive_html_create(items, html_string) {

    // Make sure there are subdecks
    if (Object.keys(items).length > 0) {

        html_string += "<ul>";

        for (let sub_item_name in items) {

            html_string += '<li><div><input type="checkbox" onclick="handle_deck_click(this)" id="checkbox' +  items[sub_item_name].id + '">' + sub_item_name + '</div>';
            html_string = recursive_html_create(items[sub_item_name].sub_decks, html_string);
        }

        html_string += "</ul>";

    }
    console.log(html_string);
    return html_string;
}

handle_deck_click = function(checkbox) {

    let checkbox_id = (checkbox.id).replace("checkbox","");
    if (checkbox.checked) {
        checked_columns.push(checkbox_id);
    } else {
        checked_columns.splice(checked_columns.indexOf(checkbox_id), 1); // 2nd parameter means remove one item only
    }
    console.log(checked_columns);


}
window.get_db = function() {
    return anki_db;
}

window.get_zip = function() {
    return zip;
}

// Currently supported options: question_count, column_status, random_count
window.get_user_options = function(option_category) {

    let user_options = [];
    switch(option_category) {
        
        case "create_test":
            user_options = ["question_count", "random_count", "column_status"];
            break;
    }
    
    return create_options_html(user_options);
}


create_options_html = function(user_options) {
    
    let option_html = '<div class="content_box" id="options"><div><h1>Options</h1></div>';
    for (let option of user_options) {

        switch(option) {
        
            case "question_count":
                option_html += '<div><label>Number of cards: </label><input type="number" id="number_of_cards_input" name="number_of_cards"></div>'
                break;

            case "column_status":

                option_html += '<div id="column_options"><label> Select decks to see column options</label></div>';
                break;
            
            case "random_count":
                option_html += '<div><label>Number of random columns: </label><input type="number" id="random_column_count"></div>'
                break;
        }
    }

    option_html += '</div>';

    return option_html;
}

window.get_checked_columns = function() {
    return checked_columns;
}