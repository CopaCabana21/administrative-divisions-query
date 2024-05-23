import express from "express";
import fs from 'fs';

const app = express();
const port = 3000;

/* setup static file folders */
app.use(express.static('public'));

const addSelectionStructure = JSON.parse(fs.readFileSync("./src/data/add/288247/addSelectionStructure.json"));

app.get("/", (req, res) => {
  res.render("index.ejs", {addSelectionStructure: addSelectionStructure});
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
