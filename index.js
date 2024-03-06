require('dotenv').config();
const express = require('express');
require('./db').connect();
const path = require("path")

const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8001

app.use(express.static(path.resolve("/uploads")))

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: false}));


app.get('/', (req, res) => {
    res.end("Hello from server")
})

// Routes
const userRoute = require("./routes/user");

app.use("/user", userRoute);

app.listen(PORT, () => {
    console.log(`Server is listening at http:localhost:${PORT}`)
})