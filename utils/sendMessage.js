import axios from "axios";

/**
 * Envía un mensaje de WhatsApp.
 * - Si pasas `text`, envía mensaje libre.
 * - Si pasas `templateName`, usa una plantilla de Meta.
 * - Puedes incluir `variables` para rellenar los placeholders {{1}}, {{2}}, etc.
 */
const sendMessage = async (phone, text = null, templateName = null, variables = []) => {
  try {
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.PHONE_ID}/messages`;

    // --- Detectar idioma según plantilla
    const templateLang = {
      hello_world: "en_US",
      bienvenida_expertcell: "es_MX",
    }[templateName] || "en_US"; // default

    // --- Construir payload
    let payload;
    if (text) {
      // 🔹 Mensaje libre
      payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text },
      };
    } else if (templateName) {
      // 🔹 Mensaje con plantilla
      payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: variables.length
            ? [
                {
                  type: "body",
                  parameters: variables.map((v) => ({
                    type: "text",
                    text: v,
                  })),
                },
              ]
            : [],
        },
      };
    } else {
      throw new Error("Falta texto o nombre de plantilla");
    }

    // --- Headers
    const headers = {
      Authorization: `Bearer ${process.env.META_TOKEN}`,
      "Content-Type": "application/json",
    };

    // --- Enviar mensaje
    const response = await axios.post(url, payload, { headers });
    console.log(`✅ Enviado a ${phone}:`, response.data);

    // --- Texto legible del mensaje
    let messageText = "";

    if (text) {
      messageText = text;
    } else if (templateName === "hello_world") {
      messageText =
        "Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta.";
    } else if (templateName === "bienvenida_expertcell") {
      messageText = "Hola 👋 Bienvenido a *ExpertCell*. Estamos felices de tenerte aquí.";
    } else {
      messageText =
        variables.length > 0
          ? `[${templateName}] ${variables.join(" ")}`
          : `[${templateName}]`;
    }

    // --- Retornar resultado
    return {
      phone,
      status: "sent",
      data: response.data,
      messageText,
      templateName,
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
