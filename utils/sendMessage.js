import axios from "axios";

/**
 * Envía un mensaje usando la plantilla de prueba "hello_world"
 * (válida para entornos de prueba de Meta Cloud API)
 */
const sendMessage = async (phone) => {
  try {
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.PHONE_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: "hello_world", // 👈 usa la plantilla activa
        language: { code: "en_US" } // 👈 idioma tal cual está en Meta
      }
    };

    const headers = {
      Authorization: `Bearer ${process.env.META_TOKEN}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(url, payload, { headers });
    console.log(`✅ Enviado a ${phone}:`, response.data);
    return { phone, status: "sent", data: response.data };
  } catch (error) {
    console.error("❌ Error al enviar:", error.response?.data || error.message);
    return { phone, status: "failed", error: error.message };
  }
};

export default sendMessage;
