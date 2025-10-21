// backend/routes/webhook.js
import express from "express";
import Message from "../models/Message.js";
import sendMessage from "../utils/sendMessage.js"; // 👈 lo usamos para responder automáticamente

const router = express.Router();

// ======================================================
// 🔹 Verificación inicial del webhook (Meta)
// ======================================================
router.get("/", (req, res) => {
  const verify = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (verify === process.env.VERIFY_TOKEN) res.send(challenge);
  else res.sendStatus(403);
});

// ======================================================
// 🔹 Recepción de eventos de WhatsApp (mensajes / estados / botones)
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
              const buttonText = msg.button.text;
              console.log(`🟢 Botón presionado por ${from}: ${buttonText}`);

              // Guardamos la acción en la BD
              await Message.create({
                phone: from,
                body: `🟢 Usuario presionó: "${buttonText}"`,
                direction: "in",
                status: "received",
                messageId: msg.id,
                timestamp,
              });

              // 🔹 Enviar respuesta automática según el botón
              let replyText = "";
              if (buttonText.toLowerCase().includes("sí")) {
                replyText =
                  "✨ ¡Excelente! En breve te compartiremos más información sobre nuestros servicios y promociones.";
              } else if (buttonText.toLowerCase().includes("no")) {
                replyText =
                  "👌 Perfecto 😊 Si cambias de opinión, estamos aquí para ayudarte.";
              } else {
                replyText =
                  "✅ Gracias por tu respuesta. Un asesor te contactará si es necesario.";
              }

              // 📨 Enviar mensaje de texto de respuesta
              await sendMessage(from, replyText, null, []);

              // Guardar también el mensaje saliente
              await Message.create({
                phone: from,
                body: replyText,
                direction: "out",
                status: "sent",
                timestamp: new Date(),
              });
            }

            // 🔸 Otros tipos no manejados (image, interactive, etc.)
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
