import express from "express";
import fs from 'fs';
import path from "path";

const app = express();
const port = 3000;

/* setup static file folders */
// for index.ejs
app.use(express.static('public'));
// for index.html
// app.use(express.static('.'));


app.get("/", (req, res) => {

    // for index.ejs
    // const addTagsTree = JSON.parse(fs.readFileSync("./data/add/addsDataMinJoinedTree.json"));
    // res.render("index.ejs", {addSelectionStructure: addTagsTree});
    
    // for index.html
    res.sendFile("index.html", {root: '.'});
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
