// Libraries
const JSZip = require("jszip"); // Used for zipping/unzipping in-memory on client-side
const initSqlJs = require("sql.js"); // Used to read and update anki files in-memory on client-side
const anki = require("./anki_handling.js");

// Global variable to use across multiple methods and states
var zip; // Used to store all items from the anki zip file
var anki_db; // Used to store anki db objects (decks, cards, notes, etc.)
var current_website_state; // Used to keep track of which part of the website is currently used

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
        }
    
    });

}

window.get_html_deck_graph = function() {
    let deck_json = anki.get_decks(anki_db);

    // Create html string
    let html_deck_graph = "";
    let counter = 0;
    html_deck_graph += '<ul class="tree">';
    
    for (let sub_item_name in deck_json) {
        counter++;
        html_deck_graph += '<li><div><input type="checkbox" onclick="handle_deck_click(this)" id="checkbox' + counter + '" name="' + sub_item_name + '">' + sub_item_name + '</div>';
        console.log(111);
        console.log(deck_json[sub_item_name]);
        console.log(Object.keys(deck_json[sub_item_name].sub_decks).length);
        if (Object.keys(deck_json[sub_item_name].sub_decks).length > 0) {
            [html_deck_graph, counter] = recursive_html_create(deck_json[sub_item_name].sub_decks, html_deck_graph, counter);     
        } 
    }
    html_deck_graph += "</ul>";
    return html_deck_graph;
}

// Used in create_html_from_json for recursive graph traversal
function recursive_html_create(item, html_string, counter) {
    console.log("xyz");
    console.log(item);
    console.log(Object.keys(item).length);
    if (Object.keys(item).length > 0) {

        html_string += "<ul>";

        for (let sub_item_name in item) {

            counter++;
            html_string += '<li><div><input type="checkbox" onclick="handle_deck_click(this)" id="checkbox' + counter + '">' + sub_item_name + '</div>';
            [html_string, counter] = recursive_html_create(item[sub_item_name].sub_decks, html_string, counter);
        }

        html_string += "</ul>";

    }
    return [html_string, counter];

}

window.get_db = function() {
    return anki_db;
}

window.get_zip = function() {
    return zip;
}