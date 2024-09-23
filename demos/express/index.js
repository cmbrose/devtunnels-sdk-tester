const express = require("express");
const app = express();
const port = 3001;

app.get("/", (req, res) => {
    console.log(`${new Date()} ${req.method} ${req.path}`);
    res.send("Hello world!");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// process.on('SIGINT', () => {
//     console.log("sigint");
// })


// setInterval(() => {
//     console.log("interval");
// }, 1000 * 2); // 2 seconds