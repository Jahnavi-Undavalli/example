const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getMoviesQuery = `
    SELECT
      *
    FROM
      state;`;
  const moviesArray = await database.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachPlayer) =>
      convertStateDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      state
    WHERE 
      state_id = ${stateId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertStateDbObjectToResponseObject(movie));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, active, deaths } = request.body;
  const postMovieQuery = `
  INSERT INTO
    district ( district_name,state_id,cases,active,deaths)
  VALUES
    (${districtName}, '${stateId}', '${cases}', '${active}', '${deaths}');`;
  await database.run(postMovieQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      district
    WHERE 
      district_id = ${districtId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertDistrictDbObjectToResponseObject(movie));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteMovieQuery);
  response.send(`District Removed`);
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateMovieQuery = `
            UPDATE
              district
            SET
              district_name = ${districtName},
              state_id = '${stateId}',
              cases = '${cases}'
              cured = '${cured}',
              active = '${active}'
              deaths = '${deaths}'
            WHERE
              district_id = ${districtId};`;

  await database.run(updateMovieQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getMovieQuery = `
    SELECT 
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM 
      district
    WHERE 
      state_id = ${stateId};`;

  const stats = await database.get(getMovieQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getMoviesQuery = `
    SELECT
      state_name
    FROM
      district
      natural join state
      WHERE 
       district_id = ${districtId};`;
  const moviesArray = await database.all(getMoviesQuery);
  console.log(moviesArray);
  response.send(
    moviesArray.map((eachMovie) => ({ stateName: eachMovie.state_name }))
  );
});

module.exports = app;
