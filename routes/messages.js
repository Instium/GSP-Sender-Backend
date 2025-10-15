import express from "express";
import Message from "../models/Message.js";
import sendMessage from "../utils/sendMessage.js";

const router = express.Router();

/**
 * GET /api/messages
 * Permite listar mensajes con filtros opcionales:
 *   ?phone=5212221476111
 *   ?direction=in/out
 *   ?status=sent/read
 *   ?limit=20
 */
router.get("/", async (req, res) => {
  try {
    const { phone, direction, status, limit } = req.query;
    const filter = {};

    if (phone) filter.phone = phone;
    if (direction) filter.direction = direction;
    if (status) filter.status = status;
    if (campaignId) filter.campaignId = campaignId; // 🔹 Nuevo filtro

    const messages = await Message.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit) || 50);

    res.json({
      ok: true,
      total: messages.length,
      messages
    });
  } catch (err) {
    console.error("❌ Error al obtener mensajes:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Enviar mensaje de texto libre (solo si la conversación está abierta)
router.post("/sendText", async (req, res) => {
  try {
    const { phone, body } = req.body;

    if (!phone || !body) {
      return res.status(400).json({ ok: false, error: "Faltan datos (phone o body)" });
    }

    // Llamamos a la función genérica de envío (usa la API de Meta)
    const result = await sendMessage(phone, body); // 👈 se le pasa texto plano ahora

    // Guardamos también el mensaje en la base de datos
    const msg = await Message.create({
      phone,
      body,
      direction: "out",
      status: result?.status || "sent",
      messageId: result?.data?.messages?.[0]?.id || null,
      timestamp: new Date()
    });

    res.json({ ok: true, result, msg });
  } catch (err) {
    console.error("❌ Error al enviar mensaje libre:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


export default router;
