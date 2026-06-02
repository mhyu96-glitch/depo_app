const axios = require('axios');
require('dotenv').config();

/**
 * Send WhatsApp message using Fonnte or other API
 * @param {String} to - Target phone number
 * @param {String} message - Message content
 */
const sendWhatsApp = async (to, message) => {
  if (!to || !message) return;

  const apiKey = process.env.WHATSAPP_API_KEY;
  const apiUrl = process.env.WHATSAPP_API_URL || 'https://api.fonnte.com/send';

  // Log message for debugging in development
  console.log(`[WA] Sending to ${to}: ${message}`);

  if (!apiKey || apiKey === 'your_whatsapp_api_key_here') {
    console.log('[WA] WhatsApp API Key not configured. Message logged but not sent.');
    return { success: true, message: 'Logged (no API key)' };
  }

  try {
    const response = await axios.post(apiUrl, {
      target: to,
      message: message,
    }, {
      headers: {
        'Authorization': apiKey
      }
    });
    return { success: true, data: response.data };
  } catch (err) {
    console.error(`[WA] Error sending message: ${err.message}`);
    return { success: false, error: err.message };
  }
};

module.exports = { sendWhatsApp };
