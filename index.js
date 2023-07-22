const { log } = require("console");
const sqlite3 = require("sqlite3");
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());
let db = new sqlite3.Database("./newDB.db", (err) => {
  if (err) {
    console.log("Error Occurred - " + err.message);
  } else {
    console.log("DataBase Connected");
  }
});

//API TO LOAD DATA TO LOCAL DB

app.get("/loadDB", async (req, res) => {
  async function cleanDB() {
    db.exec("delete from products", (err, pass) => {
      console.log("data cleaned");
    });
  }
  async function storeToLocalDb() {
    const data = await fetch(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const x = await data.json();
    x.map((each) => {
      db.exec(
        `insert into products values(${each.id},
              '${each.title}',
              ${each.price},
              "${each.description}",
              "${each.category}",
              '${each.image}',
              ${each.sold},
              '${each.dateOfSale}')`,
        (err, mess) => {
          console.log(mess);
        }
      );
    });
  }
  await cleanDB();
  await storeToLocalDb();
  res.send("Data loaded successfully");
});

//API #1

app.get("/statistics/:month", (req, res) => {
  const { month } = req.params;
  db.all(
    `select sum(price*sold) as Total_sale_amount, 
    COUNT(case sold when 0 then null else 1 end) as number_of_sold_items,
    COUNT(case sold when 0 then 1 else null end) as number_of_unsold_items, 
    strftime('%m',dateOfSale) as "Month" from products where CAST(strftime('%m',dateOfSale) as integer) = ${month}
    GROUP BY strftime('%m',dateOfSale)`,
    (err, response) => {
      res.send(response);
    }
  );
});

// API #2

app.get("/barChart/:month", (req, res) => {
  const { month } = req.params;
  db.all(
    `SELECT
    CASE 
        WHEN price >= 0 AND price < 100 THEN '0-100'
        WHEN price >= 101 AND price < 200 THEN '101-200'
        WHEN price >= 201 AND price < 300 THEN '201-300'
        WHEN price >= 301 AND price < 400 THEN '301-400'
        WHEN price >= 401 AND price < 500 THEN '401-500'
        WHEN price >= 501 AND price < 600 THEN '501-600'
        WHEN price >= 601 AND price < 700 THEN '601-700'
        WHEN price >= 701 AND price < 800 THEN '701-800'
        WHEN price >= 801 AND price < 900 THEN '801-900'
        WHEN price >= 901 THEN '901 - above'
        END AS price_range,
    COUNT(*) AS item_count
    FROM
    products
WHERE
    cast(strftime('%m', dateOfSale)as integer) = ${month}
GROUP BY
    price_range;`,
    (err, response) => {
      res.send(response);
    }
  );
});

// API #3
app.get("/pieChart/:month", (req, res) => {
  const { month } = req.params;
  db.all(
    `SELECT
    category,
    COUNT(*) AS item_count
FROM
    products
WHERE
    cast(strftime('%m', dateOfSale) as integer) = ${month}
GROUP BY
    category;`,
    (err, response) => {
      res.send(response);
    }
  );
});

// Function to fetch data from API 1
async function fetchDataFromAPI1(month) {
  try {
    const response = await axios.get(
      `http://localhost:3000/statistics/${month}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data from API 1:", error.message);
    return [];
  }
}

// Function to fetch data from API 2
async function fetchDataFromAPI2(month) {
  try {
    const response = await axios.get(`http://localhost:3000/barChart/${month}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data from API 2:", error.message);
    return [];
  }
}

// Function to fetch data from API 3
async function fetchDataFromAPI3(month) {
  try {
    const response = await axios.get(`http://localhost:3000/pieChart/${month}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data from API 3:", error.message);
    return [];
  }
}

// Route to handle incoming API requests
app.get("/combined-data/:month", async (req, res) => {
  const { month } = req.params;
  try {
    // Fetch data from all three APIs in parallel
    const [dataFromAPI1, dataFromAPI2, dataFromAPI3] = await Promise.all([
      fetchDataFromAPI1(month),
      fetchDataFromAPI2(month),
      fetchDataFromAPI3(month),
    ]);

    // Combine the responses into a single JSON object
    const combinedResponse = {
      api1Data: dataFromAPI1,
      api2Data: dataFromAPI2,
      api3Data: dataFromAPI3,
    };

    res.json(combinedResponse);
  } catch (error) {
    console.error("Error processing API requests:", error.message);
    res.status(500).json({ error: "Failed to fetch combined data" });
  }
});

// Start the server

app.listen(3000);
