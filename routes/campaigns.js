// backend/routes/campaigns.js
import express from "express";
import sendMessage from "../utils/sendMessage.js";
import Campaign from "../models/Campaign.js";
import Message from "../models/Message.js";

const router = express.Router();

// GET campañas (igual)
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ ok: true, total: campaigns.length, campaigns });
  } catch (err) {
    console.error("Error al obtener campañas:", err);
    res.status(500).json({ ok: false, message: "Error al obtener campañas" });
  }
});

router.post("/send", async (req, res) => {
  const { numbers, name } = req.body;
  if (!numbers?.length) return res.status(400).json({ error: "Faltan números" });

  // plantilla fija por ahora
  const TEMPLATE = "hello_world";

  const campaign = await Campaign.create({
    name: name || `Campaña_${Date.now()}`,
    template: TEMPLATE,
    totalNumbers: numbers.length,
  });

  let successful = 0, failed = 0;
  const results = [];

  for (const phone of numbers) {
    const result = await sendMessage(phone, null, TEMPLATE); // ← usamos hello_world
    results.push({ phone, status: result.status });

    // Guardamos el texto visible y el nombre real de la plantilla
    await Message.create({
      phone,
      body: result.messageText,               // ← texto legible (Welcome and congratulations…)
      template: result.templateName || TEMPLATE,
      status: result.status,
      messageId: result.data?.messages?.[0]?.id || null,
      campaignId: campaign._id,
      direction: "out",
      timestamp: new Date(),
    });

    result.status === "sent" ? successful++ : failed++;
    await new Promise((r) => setTimeout(r, 600)); // 0.6s: más ágil en dev
  }

  campaign.successful = successful;
  campaign.failed = failed;
  await campaign.save();

  res.json({ ok: true, campaign, results });
});

export default router;
