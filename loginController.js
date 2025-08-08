module.exports = (db) => {
  return (req, res) => {
    const { Email, Password } = req.body;
    const sql = "SELECT ID, Name, Email, Contact, Role, Active FROM usermanagement WHERE Email = ? AND Password = ?";
    db.query(sql, [Email, Password], (err, result) => {
      if (err) {
        console.error("DB error at login:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (result.length > 0) {
        const user = result[0];
        if (!user.Active) {
          return res.status(403).json({ success: false, message: "Account not active" });
        }
        return res.json({ success: true, user });
      } else {
        return res.status(401).json({ success: false, message: "Invalid email/password" });
      }
    });
  }
};