module.exports = {

    get_decks: function(db) {
        // let models = db.exec("select models from col");
        // console.log("models");
        // console.log(models[0].values[0]);

        // // Get all models from user decks
        // models = JSON.parse(models[0].values[0]);
        let deck_graph = {}; // JSON to store final anki deck graph

        // Get all decks from user
        let decks = db.exec("select decks from col");
        decks = JSON.parse(decks[0].values[0]);
        console.log(345);
        console.log(decks);
        for (let deck_id in decks) {

            // Skip default deck as it is not needed for this graph
            if (deck_id == 1) {
                continue;
            }

            // Anki decks are seperated with '::' in given path
            let deck_list = decks[deck_id].name.split("::");
            let curr_branch = deck_graph;

            // Index used to set id at the correct branch
            let index = deck_list.length;

            for (let deck of deck_list) {

                // Check if branch already exists
                if (!curr_branch[deck]) {
                    curr_branch[deck] = {
                        "sub_decks": {}
                    };
                }

                index--;
                if (index == 0) {
                    curr_branch[deck]["id"] = deck_id;
                }

                curr_branch = curr_branch[deck].sub_decks;
            }
        }
        return deck_graph;
    }
}