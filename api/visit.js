export default async function handler(req, res) {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    const ua = req.headers["user-agent"] || "unknown";

    let location = "unknown";

    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geo = await geoRes.json();
      location = `${geo.city || ""}, ${geo.country || ""}`;
    } catch (e) {
      console.log("Geo failed, continuing...");
    }

    const message = `
👀 New Visitor
IP: ${ip}
Location: ${location}
Device: ${ua}
Time: ${new Date().toLocaleString()}
    `;

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
