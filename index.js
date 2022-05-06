const express = require("express");
const api = require("./routes/api");

const app = express();

const port = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/data-service", api);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
