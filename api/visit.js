import UAParser from "ua-parser-js";

export default async function handler(req, res) {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    // Parse UA into human-readable parts
    const parser = new UAParser(req.headers["user-agent"] || "");
    const { browser, os, device } = parser.getResult();

    const deviceStr = [
      device.vendor && device.model
        ? `${device.vendor} ${device.model}`
        : device.type || "Desktop/Unknown",
      os.name ? `${os.name} ${os.version || ""}`.trim() : "",
      browser.name ? `${browser.name} ${browser.version || ""}`.trim() : "",
    ]
      .filter(Boolean)
      .join(" · ");

    let location = "unknown";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geo = await geoRes.json();
      location = `${geo.city || ""}, ${geo.country || ""}`.trim();
    } catch (e) {
      console.log("Geo failed, continuing...");
    }

    const message = `
👀 New Visitor
IP: ${ip}
📍 Location: ${location}
📱 Device: ${deviceStr}
🕐 Time: ${new Date().toLocaleString()}
    `.trim();

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TG_CHAT_ID,
          text: message,
        }),
      },
    );

    const tgData = await tgRes.json();
    console.log("Telegram response:", tgData);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: "failed" });
  }
}
