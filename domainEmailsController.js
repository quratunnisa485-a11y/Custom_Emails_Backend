const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/", (req, res) => {
    const sql = "SELECT * FROM domainemails";
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching domain emails:", err);
        return res.status(500).json({ error: "Failed to fetch data" });
      }
      res.json(results);
    });
  });

  router.post("/", (req, res) => {
    const { domain, emails, status } = req.body;
    const emailList = emails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

    const checkQuery = "SELECT * FROM domainemails WHERE domain = ?";
    db.query(checkQuery, [domain], (err, results) => {
      if (err) {
        console.error("DB error during domain check:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length > 0) {
        const existingEmails = results[0].emails
          ? results[0].emails.split(",").map((e) => e.trim().toLowerCase())
          : [];

        const mergedEmails = Array.from(new Set([...existingEmails, ...emailList])); 
        const updatedEmailString = mergedEmails.join(", ");

        const updateQuery = "UPDATE domainemails SET emails = ? WHERE domain = ?";
        db.query(updateQuery, [updatedEmailString, domain], (err2) => {
          if (err2) {
            console.error("Failed to update emails:", err2);
            return res.status(500).json({ error: "Update failed" });
          }
          res.json({ message: "Emails updated under existing domain" });
        });
      } else {
        const emailString = emailList.join(", ");
        const insertQuery =
          "INSERT INTO domainemails (domain, emails, status) VALUES (?, ?, ?)";
        db.query(insertQuery, [domain, emailString, status || "Pending"], (err3, result) => {
          if (err3) {
            console.error("Insert failed:", err3);
            return res.status(500).json({ error: "Insert failed" });
          }
          res.json({ message: "Inserted successfully", id: result.insertId });
        });
      }
    });
  });

  router.put("/:id", (req, res) => {
    const { domain, emails, status } = req.body;
    const sql = "UPDATE domainemails SET domain = ?, emails = ?, status = ? WHERE id = ?";
    db.query(sql, [domain, emails, status, req.params.id], (err) => {
      if (err) {
        console.error("Error updating domain email:", err);
        return res.status(500).json({ error: "Failed to update data" });
      }
      res.json({ message: "Updated successfully" });
    });
  });

  router.delete("/:id", (req, res) => {
    const sql = "DELETE FROM domainemails WHERE id = ?";
    db.query(sql, [req.params.id], (err) => {
      if (err) {
        console.error("Error deleting domain email:", err);
        return res.status(500).json({ error: "Failed to delete data" });
      }
      res.json({ message: "Deleted successfully" });
    });
  });
  
router.put("/update-status/:domain", (req, res) => {
  const { status } = req.body;
  const domain = req.params.domain;

  const sql = "UPDATE domainemails SET status = ? WHERE domain = ?";
  db.query(sql, [status, domain], (err, result) => {
    if (err) {
      console.error("Error updating status:", err);
      return res.status(500).json({ error: "Failed to update status" });
    }

    res.json({ message: "Status updated", affectedRows: result.affectedRows });
  });
});

  return router;
};
