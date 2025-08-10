
const express = require("express");
const router = express.Router();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "turntable.proxy.rlwy.net",
  port: 57087,
  user: "root",
  password: "jFeSaqOCKdgwUQurNkNvEvdRfLKEBKij", // ✅ Your actual password
  database: "railway"
});

router.get("/total-users", (req, res) => {
  db.query("SELECT COUNT(*) AS total FROM usermanagement", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
});

router.get("/active-users", (req, res) => {
  db.query("SELECT COUNT(*) AS active FROM usermanagement WHERE Active = 1", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
});

router.get("/inactive-users", (req, res) => {
  db.query("SELECT COUNT(*) AS inactive FROM usermanagement WHERE Active = 0", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
});

router.get("/role-counts", (req, res) => {
  db.query("SELECT Role, COUNT(*) AS count FROM usermanagement GROUP BY Role", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});


router.get("/monthly-signups", (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') AS month,
      COUNT(*) AS total,
      SUM(Active = 1) AS active,
      SUM(Active = 0) AS inactive
    FROM usermanagement
    GROUP BY month
    ORDER BY month;
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

router.get("/total-verified-senders", (req, res) => {
  db.query("SELECT COUNT(*) AS total FROM personalemails", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
});

router.get("/email-providers", (req, res) => {
  db.query(`
    SELECT 
      SUBSTRING_INDEX(email, '@', -1) AS provider,
      COUNT(*) AS total 
    FROM personalemails 
    GROUP BY provider
  `, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

router.get("/top-sender-names", (req, res) => {
  db.query(`
    SELECT name, COUNT(*) AS total 
    FROM personalemails 
    WHERE name IS NOT NULL AND name != ''
    GROUP BY name 
    ORDER BY total DESC 
    LIMIT 5
  `, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});


router.get("/domain-email-stats", (req, res) => {
  const sql = `
    SELECT 
      COUNT(DISTINCT domain) AS totalDomains,
      SUM(CHAR_LENGTH(emails) - CHAR_LENGTH(REPLACE(emails, ',', '')) + 1) AS totalEmails,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) AS sent,
      SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) AS failed
    FROM domainemails;
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
});

  router.get("/top-domains", (req, res) => {
    const query = `
      SELECT domain, 
             LENGTH(emails) - LENGTH(REPLACE(emails, ',', '')) + 1 AS email_count
      FROM domainemails
      WHERE emails IS NOT NULL AND emails != ''
      ORDER BY email_count DESC
      LIMIT 2;
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching top domains:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(result);
    });
  });

 

router.get("/daily-email-status", (req, res) => {
  db.query(`
    SELECT DATE(sent_at) AS date,
           SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) AS sent,
           SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) AS failed
    FROM domainemails
    WHERE sent_at IS NOT NULL
    GROUP BY DATE(sent_at)
    ORDER BY DATE(sent_at)
  `, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});
module.exports = router;
