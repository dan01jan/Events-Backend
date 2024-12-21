const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
require("dotenv/config");


app.use(cors());

app.options("*", cors());

//middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use(errorHandler);
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));


//Routes
const usersRoutes = require("./routes/user");
const eventRoutes = require("./routes/event")
const questionnaireRoutes = require('./routes/questionnaire');
const sentimentRoutes = require("./routes/sentiment");
const courseRoutes = require("./routes/course");
const ratingRoutes = require("./routes/rating");
const traitRoutes = require("./routes/trait")
const questionRoutes = require("./routes/question")
const responseRoutes = require("./routes/response")


const api = process.env.API_URL;

app.use(`${api}/users`, usersRoutes);
app.use(`${api}/questionnaires`, questionnaireRoutes);
app.use(`${api}/sentiments`, sentimentRoutes);
app.use(`${api}/events`, eventRoutes);
app.use(`${api}/course`, courseRoutes);
app.use(`${api}/ratings`, ratingRoutes);
app.use(`${api}/traits`, traitRoutes);
app.use(`${api}/questions`, questionRoutes);
app.use(`${api}/responses`, responseRoutes);
app.get("/", (req, res) => {
  res.send("Server is running");
});


//Database
mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // dbName: "eshop",
  })
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log(err);
  });

//Server
const port = process.env.PORT || 4000; // Fallback to 4000 if process.env.PORT is not defined
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
