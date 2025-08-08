

module.exports = (db) => {
  const express = require("express");
  const router = express.Router();

  router.get("/", (req, res) => {
    db.query("SELECT * FROM personalemails", (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  });

  router.post("/", (req, res) => {
    const { email, password, phone, website, name, signature_email } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const checkSql = "SELECT * FROM personalemails WHERE email = ?";
    db.query(checkSql, [email], (checkErr, checkResult) => {
      if (checkErr) return res.status(500).json({ error: "Database error" });

      if (checkResult.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const insertSql = `
        INSERT INTO personalemails (email, password, phone, website, name, signature_email)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [email, password, phone, website, name, signature_email];

      db.query(insertSql, values, (insertErr, result) => {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        res.json({ message: "Inserted", id: result.insertId });
      });
    });
  });

  router.put("/:email", (req, res) => {
    const { password, phone, website, name, signature_email } = req.body;
    const sql = `
      UPDATE personalemails
      SET password = ?, phone = ?, website = ?, name = ?, signature_email = ?
      WHERE email = ?
    `;
    const values = [password, phone, website, name, signature_email, req.params.email];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Updated" });
    });
  });

  router.delete("/:email", (req, res) => {
    const sql = "DELETE FROM personalemails WHERE email = ?";
    db.query(sql, [req.params.email], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Deleted" });
    });
  });

  return router;
};
