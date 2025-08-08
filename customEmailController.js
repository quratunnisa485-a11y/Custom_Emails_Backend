const express = require("express");
const nodemailer = require("nodemailer");

module.exports = (db) => {
  const router = express.Router();

  
  router.get("/senders", (req, res) => {
    db.query("SELECT * FROM personalemails", (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  });

 
  router.get("/domains", (req, res) => {
    db.query("SELECT domain FROM domainemails", (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.map((r) => r.domain));
    });
  });

  
  router.post("/send", (req, res) => {
    const { fromEmail, subject, message, domain } = req.body;

    if (!fromEmail || !domain || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    
    db.query("SELECT * FROM personalemails WHERE email = ?", [fromEmail], (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ error: "Sender not found" });
      }

      const sender = results[0];

      
      db.query("SELECT emails FROM domainemails WHERE domain = ?", [domain], async (err2, rows) => {
        if (err2 || rows.length === 0) {
          return res.status(500).json({ error: "No recipients found for this domain" });
        }

        const recipients = rows[0].emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);

        if (recipients.length === 0) {
          return res.status(400).json({ error: "No valid email recipients" });
        }

        
        const transporter = nodemailer.createTransport({
          service: "gmail", 
          auth: {
            user: sender.email,
            pass: sender.password,
          },
        });

        const mailOptions = {
          from: sender.email,
          to: recipients,
          subject,
          html: `${message.replace(/\n/g, "<br/>")}<br/><br/>
            <div style="font-family:sans-serif;">
              📞 ${sender.phone}<br/>
              📧 ${sender.signature_email}<br/>
              🔗 ${sender.website}<br/>
              ✍️ Regards, ${sender.name}
            </div>`,
        };

        try {
          const info = await transporter.sendMail(mailOptions);

          
          db.query(
            "INSERT INTO customemails (from_email, domain, subject, message, recipients, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [
              fromEmail,
              domain,
              subject,
              message,
              recipients.join(","),
              "sent",
            ],
            (err3) => {
              if (err3) {
                console.error("Email sent but failed to log:", err3.message);
                return res.status(500).json({
                  success: true,
                  warning: "Email sent but not logged.",
                  messageId: info.messageId,
                });
              }

              return res.json({
                success: true,
                message: "Email sent and logged successfully",
                messageId: info.messageId,
              });
            }
          );
        } catch (e) {
          return res.status(500).json({ error: "Failed to send email", detail: e.message });
        }
      });
    });
  });

  return router;
};
