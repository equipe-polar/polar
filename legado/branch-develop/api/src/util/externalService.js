const axios = require("axios");

async function sendOccurrenceToExternalApi(occurrence) {
  const url = process.env.EXTERNAL_API_URL;
  if (!url) {
    return {
      success: false,
      skipped: true,
      message: "EXTERNAL_API_URL nao configurada.",
    };
  }

  try {
    const response = await axios.post(url, occurrence, {
      timeout: Number(process.env.EXTERNAL_API_TIMEOUT || 5000),
      headers: {
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response ? error.response.status : null,
      message: error.message,
    };
  }
}

module.exports = {
  sendOccurrenceToExternalApi,
};
