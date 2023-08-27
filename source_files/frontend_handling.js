// Libraries
const JSZip = require("jszip"); // Used for zipping/unzipping in-memory on client-side
const initSqlJs = require("sql.js"); // Used to read and update anki files in-memory on client-side

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

        zip.loadAsync(event.target.result).then(function(zip) {
        // Only use the necessary sql file for the in-memory db
        zip.forEach(function (relativePath, zipEntry) {
            if (relativePath == "collection.anki21") {
                zipEntry.async("uint8array").then(function (fileData) {
                    console.log("File: " + relativePath);
                    console.log("Data: " + fileData);
                    console.log(new TextDecoder().decode(fileData));
                    callback(fileData);
                  });
            }
        });
      });
    };
}

// Processes anki db objects in-memory for further use
window.process_anki_db = function(anki_file) {
    console.log(anki_file);

    // Apkg is a zip file that has 2 db files and a folder for media (.anki21 is the one we need)
    unzipFile(anki_file, async function(fileData) {
        if (fileData) {
            const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });

            // Create db with user anki21 file as arraybuffer
            anki_db = new SQL.Database(fileData);
        }
    
    });

}