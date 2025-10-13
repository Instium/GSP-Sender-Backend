import express from "express";
import Message from "../models/Message.js";

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

export default router;
