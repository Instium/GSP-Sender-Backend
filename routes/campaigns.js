import express from "express";
import sendMessage from "../utils/sendMessage.js";
import Campaign from "../models/Campaign.js";
import Message from "../models/Message.js";

const router = express.Router();

router.post("/send", async (req, res) => {
  const { numbers, nombre, plan, name } = req.body;
  if (!numbers?.length) return res.status(400).json({ error: "Faltan números" });

  const campaign = await Campaign.create({
    name: name || `Campaña_${Date.now()}`,
    template: "prueba_oct",
    totalNumbers: numbers.length,
  });

  let successful = 0, failed = 0;
  const results = [];

  for (const phone of numbers) {
    const result = await sendMessage(phone);
    results.push(result);

    await Message.create({
      phone,
      template: "prueba_oct",
      status: result.status,
      messageId: result.data?.messages?.[0]?.id || null,
      campaignId: campaign._id
    });

    result.status === "sent" ? successful++ : failed++;
    await new Promise(r => setTimeout(r, 6000));
  }

  campaign.successful = successful;
  campaign.failed = failed;
  await campaign.save();

  res.json({ ok: true, campaign, results });
});

export default router;
