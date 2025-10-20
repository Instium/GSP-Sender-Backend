// backend/routes/campaigns.js
import express from "express";
import axios from "axios";
import sendMessage from "../utils/sendMessage.js";
import Campaign from "../models/Campaign.js";
import Message from "../models/Message.js";

const router = express.Router();

// ======================================================
// 🔹 GET /campaigns -> listar campañas
// ======================================================
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ ok: true, total: campaigns.length, campaigns });
  } catch (err) {
    console.error("Error al obtener campañas:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error al obtener campañas" });
  }
});

// ======================================================
// 🔹 GET /campaigns/templates -> obtener plantillas desde Meta
// ======================================================
router.get("/templates", async (req, res) => {
  try {
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.BUSINESS_ID}/message_templates`;
    const headers = {
      Authorization: `Bearer ${process.env.META_TOKEN}`,
    };

    const { data } = await axios.get(url, { headers });

    const templates = (data.data || []).map((t) => {
      // Buscar el componente BODY (para contar variables)
      const body = t.components?.find((c) => c.type === "BODY");
      const buttons =
        t.components
          ?.find((c) => c.type === "BUTTONS")
          ?.buttons?.map((b) => b.text) || [];

      const varCount = (body?.text.match(/{{\d+}}/g) || []).length;

      return {
        name: t.name,
        language: t.language,
        category: t.category,
        variables: varCount,
        buttons,
      };
    });

    res.json({ ok: true, total: templates.length, templates });
  } catch (err) {
    console.error("❌ Error al obtener plantillas:", err.response?.data || err.message);
    res.status(500).json({ ok: false, message: "Error al obtener plantillas" });
  }
});

// ======================================================
// 🔹 POST /campaigns/send -> enviar campaña masiva dinámica
// ======================================================
router.post("/send", async (req, res) => {
  const { numbers, name, template } = req.body;
  if (!numbers?.length)
    return res.status(400).json({ error: "Faltan números" });

  const TEMPLATE = template || "hello_world";

  const campaign = await Campaign.create({
    name: name || `Campaña_${Date.now()}`,
    template: TEMPLATE,
    totalNumbers: numbers.length,
  });

  let successful = 0;
  let failed = 0;
  const results = [];

  for (const item of numbers) {
    const phone = typeof item === "string" ? item : item.phone;
    const vars = Array.isArray(item.variables) ? item.variables : [];

    const result = await sendMessage(phone, null, TEMPLATE, vars);
    results.push({ phone, status: result.status });

    // Guardamos el mensaje en la base de datos
    await Message.create({
      phone,
      body: result.messageText,
      template: result.templateName || TEMPLATE,
      status: result.status,
      messageId: result.data?.messages?.[0]?.id || null,
      campaignId: campaign._id,
      direction: "out",
      timestamp: new Date(),
    });

    result.status === "sent" ? successful++ : failed++;

    // Pequeña pausa entre envíos (0.5s)
    await new Promise((r) => setTimeout(r, 500));
  }

  campaign.successful = successful;
  campaign.failed = failed;
  await campaign.save();

  res.json({ ok: true, campaign, results });
});

export default router;
