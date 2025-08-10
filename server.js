// server.js
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

// Controllers import
const loginController = require("./loginController");
const personalEmailsController = require("./personalEmailsController");
const domainEmailsController = require("./domainEmailsController");
const dashboardController = require("./dashboardController");
const customEmailController = require("./customEmailController");

const app = express();
app.use(cors());
app.use(express.json());

// ===== MySQL Database Connection (Railway) =====
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Test DB connection
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to MySQL database (Railway)");
  }
});

// ===== Root route for Railway test =====
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully on Railway 🚀");
});

// ===== Routes =====
app.use("/customemail", customEmailController(db));
app.post("/login", loginController(db));

app.post("/verify-credentials", (req, res) => {
  const { Email, Password } = req.body;
  const sql = `
    SELECT * FROM usermanagement 
    WHERE Email = ? AND Password = ? AND Active = 1
  `;

  db.query(sql, [Email, Password], (err, result) => {
    if (err) {
      console.error("Credential verification error:", err);
      return res.status(500).json({ success: false });
    }
    if (result.length > 0) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false });
    }
  });
});

app.get("/user-management", (req, res) => {
  const sql = `
    SELECT ID, Name, Email, Contact, Role, Active, Password 
    FROM usermanagement
  `;

  db.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Failed to fetch data" });

    const formatted = result.map((row) => ({
      id: row.ID,
      name: row.Name,
      email: row.Email,
      contact: row.Contact,
      role: row.Role,
      active: !!row.Active,
      password: row.Password,
    }));

    return res.json(formatted);
  });
});

app.post("/user-management", (req, res) => {
  const sql = `
    INSERT INTO usermanagement 
    (Name, Email, Contact, Role, Active, Password, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  const values = [
    req.body.name,
    req.body.email,
    req.body.contact,
    req.body.role,
    req.body.active ? 1 : 0,
    req.body.password,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log("Error inserting user:", err);
      return res.status(500).json({ Error: "Failed to insert user" });
    }
    return res.json({
      Status: "Success",
      id: result.insertId,
    });
  });
});

app.put("/user-management/:id", (req, res) => {
  const { name, email, contact, role, active, password } = req.body;
  const sql = `
    UPDATE usermanagement 
    SET Name = ?, Email = ?, Contact = ?, Role = ?, Active = ?, Password = ?
    WHERE ID = ?
  `;
  const values = [
    name,
    email,
    contact,
    role,
    active ? 1 : 0,
    password,
    req.params.id,
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ Error: "Failed to update user" });
    }
    return res.json({ Status: "Success" });
  });
});

app.delete("/user-management/:id", (req, res) => {
  const sql = "DELETE FROM usermanagement WHERE ID = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ Error: "Failed to delete user" });
    }
    return res.json({ Status: "Deleted" });
  });
});

app.use("/personalemails", personalEmailsController(db));
app.use("/domainemails", domainEmailsController(db));
app.use("/api/dashboard", dashboardController);

// ===== Start Server =====
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
