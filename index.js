require("dotenv").config();
const axios = require("axios");
const { App } = require("@slack/bolt");


const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});


const PARSE_BOT_KEY = process.env.PARSE_BOT_API_KEY;
const BASE_URL = "https://api.parse.bot/scraper/0984e08b-bfe8-4fd6-b955-866c5133a406";


const parseApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "X-API-Key": PARSE_BOT_KEY
  }
});


app.command("/tour-de-france-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: `Available Commands:
• \`/tour-de-france-current-stage\` - Get details on today's active stage
• \`/tour-de-france-stage [number]\` - Get details for a specific stage (e.g., \`/tour-de-france-stage 10\`)
• \`/tour-de-france-gc [stage_number]\` - Get top 5 General Classification standings
• \`/tour-de-france-ping\` - Check bot latency`
  });
});


app.command("/tour-de-france-ping", async ({ ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong! Latency: ${latency}ms` });
});


function formatStageResponse(stageData) {
  const dep = stageData.departure_city || "N/A";
  const arr = stageData.arrival_city || "N/A";
  const route = `${dep} ➔ ${arr}`;

  const formattedDate = stageData.date
    ? new Date(stageData.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "N/A";


  return `🚵 *Tour de France — Stage ${stageData.stage_number}*
• *Date:* ${formattedDate}
• *Route:* ${route}
• *Distance:* ${stageData.length_km ? `${stageData.length_km} km` : "N/A"}
• *Start Time:* ${stageData.start_time || "N/A"} (${stageData.timezone || "Europe/Paris"})
• *Status:* ${stageData.is_cancelled ? "Cancelled" : "Active / Scheduled"}`;
}


app.command("/tour-de-france-current-stage", async ({ ack, respond }) => {
  await ack();

  try {
    // Calling without stage_number retrieves all 21 stages
    const res = await parseApi.get(`/get_stage_info`);
    const payload = res.data.data || res.data;
    const stages = payload.stages || (Array.isArray(payload) ? payload : []);
    if (!stages.length) {
      await respond({ text: "Could not retrieve the Tour de France schedule." });
      return;
    }
    const todayStr = new Date().toISOString().split("T")[0];
    let currentStage = stages.find((s) => s.date && s.date.startsWith(todayStr));
    if (!currentStage) {
      const now = new Date();
      currentStage = stages.find((s) => new Date(s.date) >= now) || stages[stages.length - 1];
    }
    await respond({
      text: `📅 *Current / Next Active Stage*\n\n` + formatStageResponse(currentStage)
    });
  } catch (err) {
    console.error("Current Stage API Error:", err.response?.data || err.message);
    await respond({ text: "Failed to fetch information for the current stage." });
  }
});


app.command("/tour-de-france-stage", async ({ command, ack, respond }) => {
  await ack();
  const stageNum = parseInt(command.text.trim(), 10) || 1;
  try {
    const res = await parseApi.get(`/get_stage_info`, {
      params: { stage_number: stageNum }
    });
    const payload = res.data.data || res.data;
    const stagesList = payload.stages || (Array.isArray(payload) ? payload : [payload]);
    const stageData = stagesList.find((s) => s.stage_number === stageNum) || stagesList[0];
    if (!stageData || (!stageData.departure_city && !stageData.arrival_city)) {
      await respond({ text: `Stage ${stageNum} details could not be found.` });
      return;
    }
    await respond({
      text: formatStageResponse(stageData)
    });
  } catch (err) {
    console.error("Stage API Error:", err.response?.data || err.message);
    await respond({ text: `Failed to fetch info for Stage ${stageNum}.` });
  }
});


app.command("/tour-de-france-gc", async ({ command, ack, respond }) => {
  await ack();
  const stageNum = parseInt(command.text.trim(), 10) || 1;
  try {
    const res = await parseApi.get(`/get_general_classification`, {
      params: { stage_number: stageNum }
    });
    const gcData = res.data.data || res.data;
    const rankings = gcData.rankings?.slice(0, 5) || gcData.results?.slice(0, 5) || [];
    if (rankings.length === 0) {
      await respond({ text: `General Classification standings are not available for Stage ${stageNum}.` });
      return;
    }
    const leaderboard = rankings
      .map((entry, index) => {
        const pos = entry.position || index + 1;
        const name = entry.firstname && entry.lastname 
          ? `${entry.firstname} ${entry.lastname}` 
          : entry.rider_name || "Rider";
        const gap = entry.gap_seconds === 0 
          ? "Leader" 
          : entry.gap_seconds 
            ? `+${entry.gap_seconds}s` 
            : entry.time || "N/A";
        return `#${pos} *${name}* (${entry.nationality || ""}) — ${gap}`;
      })
      .join("\n");
    await respond({
      text: `🟡 *Tour de France — General Classification (After Stage ${stageNum})*\n\n${leaderboard}`
    });
  } catch (err) {
    console.error("GC API Error:", err.response?.data || err.message);
    await respond({ text: `Failed to fetch General Classification standings for Stage ${stageNum}.` });
  }
});


(async () => {
  await app.start();
  console.log("⚡️ Tour de France Slack bot is running!");
})();