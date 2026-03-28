export default async function handler(req, res) {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    const ua = req.headers["user-agent"] || "unknown";
    const referer = req.headers["referer"] || "direct";
    const lang = req.headers["accept-language"] || "unknown";

    // 🌍 Optional: get location from IP
    let location = "unknown";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geo = await geoRes.json();
      location = `${geo.city || ""}, ${geo.country || ""}`;
    } catch (e) {}

    const message = `
👀 *New Visitor*

🌐 IP: ${ip}
📍 Location: ${location}
🖥 Device: ${ua}
🌍 Language: ${lang}
🔗 Referrer: ${referer}
⏰ Time: ${new Date().toLocaleString()}
    `;

    await fetch(
      `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TG_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      },
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
}
