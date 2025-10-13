import axios from "axios";

/**
 * Envía un mensaje de WhatsApp.
 * - Si se pasa `text`, envía mensaje libre.
 * - Si no, usa la plantilla "hello_world" (modo prueba).
 */
const sendMessage = async (phone, text = null) => {
  try {
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.PHONE_ID}/messages`;

    // --- Detecta tipo de mensaje
    const payload = text
      ? {
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: text },
        }
      : {
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: "hello_world",
            language: { code: "en_US" },
          },
        };

    const headers = {
      Authorization: `Bearer ${process.env.META_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    console.log(`✅ Enviado a ${phone}:`, response.data);

    return { phone, status: "sent", data: response.data };
  } catch (error) {
    console.error("❌ Error al enviar:", error.response?.data || error.message);
    return {
      phone,
      status: "failed",
      error: error.response?.data || error.message,
    };
  }
};

export default sendMessage;
