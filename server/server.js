require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();

app.use(express.json());
app.use(cors());

// MySQL connection placeholder
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


app.get("/fetch_test_msg",(req,res)=>{
res.send("hi");
})

app.post("/post_test_msg",(req,res)=>{
console.log(req.body.test_msg);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});