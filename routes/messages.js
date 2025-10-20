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
    const { phone, direction, status, limit, campaignId } = req.query;
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
      messages,
    });
  } catch (err) {
    console.error("❌ Error al obtener mensajes:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Enviar mensaje de texto libre ---
router.post("/sendText", async (req, res) => {
  try {
    const { phone, body } = req.body;

    if (!phone || !body) {
      return res
        .status(400)
        .json({ ok: false, error: "Faltan datos (phone o body)" });
    }

    // 🚀 Llamada a la API de Meta
    const result = await sendMessage(phone, body);

    // Guardar mensaje
    const msg = await Message.create({
      phone,
      body,
      direction: "out",
      status: result?.status || "sent",
      messageId: result?.data?.messages?.[0]?.id || null,
      timestamp: new Date(),
    });

    res.json({ ok: true, result, msg });
  } catch (err) {
    console.error("❌ Error al enviar mensaje libre:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- 🗑️ Eliminar todos los mensajes de un número ---
router.delete("/", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone)
      return res
        .status(400)
        .json({ ok: false, error: "Falta el parámetro 'phone'" });

    const result = await Message.deleteMany({ phone });
    res.json({
      ok: true,
      deleted: result.deletedCount,
      message: `Eliminados ${result.deletedCount} mensajes de ${phone}`,
    });
  } catch (err) {
    console.error("❌ Error al eliminar mensajes:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
