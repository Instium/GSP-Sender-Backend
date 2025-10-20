// backend/routes/webhook.js
import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// ======================================================
// 🔹 Verificación inicial del webhook
// ======================================================
router.get("/", (req, res) => {
  const verify = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (verify === process.env.VERIFY_TOKEN) res.send(challenge);
  else res.sendStatus(403);
});

// ======================================================
// 🔹 Recepción de eventos de WhatsApp (mensajes y estados)
// ======================================================
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    if (data.object === "whatsapp_business_account") {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // 🟢 Mensajes entrantes
          if (value.messages) {
            const msg = value.messages[0];
            const from = msg.from;
            const timestamp = new Date(Number(msg.timestamp) * 1000);

            // 🔸 Si el mensaje es de tipo "text"
            if (msg.type === "text" && msg.text?.body) {
              await Message.create({
                phone: from,
                body: msg.text.body,
                direction: "in",
                status: "received",
                messageId: msg.id,
                timestamp,
              });
              console.log(`💬 Mensaje de ${from}: ${msg.text.body}`);
            }

            // 🔸 Si el mensaje es de tipo "button" (respuesta rápida)
            else if (msg.type === "button" && msg.button?.text) {
              await Message.create({
                phone: from,
                body: `🟢 Usuario presionó: "${msg.button.text}"`,
                direction: "in",
                status: "received",
                messageId: msg.id,
                timestamp,
              });
              console.log(`🟢 Botón presionado por ${from}: ${msg.button.text}`);
            }

            // 🔸 Otros tipos (puedes expandir luego: image, interactive, etc.)
            else {
              console.log(`⚪ Mensaje no manejado de tipo: ${msg.type}`);
            }
          }

          // 🟣 Actualización de estados (sent, delivered, read)
          if (value.statuses) {
            const st = value.statuses[0];
            await Message.findOneAndUpdate(
              { messageId: st.id },
              {
                status: st.status,
                timestamp: new Date(Number(st.timestamp) * 1000),
              }
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
