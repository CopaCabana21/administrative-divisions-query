import express from "express";
import fs from 'fs';

const app = express();
const port = 3000;

/* setup static file folders */
app.use(express.static('public'));

const addTagsTree = JSON.parse(fs.readFileSync("./data/add/288247/addMinTree.json"));

app.get("/", (req, res) => {
    res.render("index.ejs", {addSelectionStructure: addTagsTree});
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
