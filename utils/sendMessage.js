import axios from "axios";

/**
 * Envía un mensaje de WhatsApp.
 * Si pasas text → envía mensaje libre.
 * Si pasas template → usa una plantilla de Meta con sus variables.
 */
const sendMessage = async (phone, text = null, templateName = null, variables = []) => {
  try {
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.PHONE_ID}/messages`;

    let payload;

    if (text) {
      // 🔹 Modo texto libre
      payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text },
      };
    } else if (templateName) {
      // 🔹 Modo plantilla
      payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es_MX" },
          components: variables.length
            ? [
                {
                  type: "body",
                  parameters: variables.map((v) => ({ type: "text", text: v })),
                },
              ]
            : [],
        },
      };
    } else {
      throw new Error("Falta texto o nombre de plantilla");
    }

    const headers = {
      Authorization: `Bearer ${process.env.META_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    console.log(`✅ Enviado a ${phone}:`, response.data);

    // 🔹 Guarda texto que realmente se envió
    const messageText =
      text ||
      (variables.length
        ? `[${templateName}] ${variables.join(" ")}`
        : `[${templateName}]`);

    return {
      phone,
      status: "sent",
      data: response.data,
      messageText,
    };
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
