import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// Verificación inicial del webhook
router.get("/", (req, res) => {
  const verify = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (verify === process.env.VERIFY_TOKEN) res.send(challenge);
  else res.sendStatus(403);
});

// Recepción de eventos (mensajes entrantes o status updates)
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (data.object === "whatsapp_business_account") {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Mensaje entrante
          if (value.messages) {
            const msg = value.messages[0];
            await Message.create({
              phone: msg.from,
              body: msg.text?.body,
              direction: "in",
              status: msg.status || "received",
              messageId: msg.id
            });
            console.log(`📩 Mensaje recibido de ${msg.from}: ${msg.text?.body}`);
          }

          // Estado de mensaje (delivered, read, etc.)
          if (value.statuses) {
            const st = value.statuses[0];
            await Message.findOneAndUpdate(
              { messageId: st.id },
              { status: st.status, timestamp: new Date(st.timestamp * 1000) }
            );
            console.log(`📬 Estado actualizado: ${st.id} → ${st.status}`);
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error procesando webhook:", err.message);
    res.sendStatus(500);
  }
});

export default router;
