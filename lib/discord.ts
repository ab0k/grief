type LogEvent = {
  type: "login" | "register" | "logout" | "oauth_login";
  method?: string;
  username?: string;
  email?: string;
  userId?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
};

const COLORS = {
  login:       0x57f287, // green
  oauth_login: 0x5865f2, // discord blue
  register:    0x7c5cfc, // purple
  logout:      0xed4245, // red
};

const LABELS = {
  login:       "LOGIN",
  oauth_login: "OAUTH LOGIN",
  register:    "REGISTER",
  logout:      "LOGOUT",
};

export async function sendDiscordLog(event: LogEvent) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const now = new Date().toISOString();
  const color = COLORS[event.type];
  const label = LABELS[event.type];

  const fields = [
    event.username && { name: "Usuario", value: `\`${event.username}\`${event.email ? `\n(${event.email})` : ""}`, inline: true },
    event.role     && { name: "Role",    value: `\`${event.role}\``,    inline: true },
    event.userId   && { name: "User ID", value: `\`${event.userId}\``,  inline: true },
    event.url      && { name: "URL",     value: `\`${event.url}\``,     inline: false },
    event.ip       && { name: "IP",      value: `\`${event.ip}\``,      inline: true },
    event.method   && { name: "Method",  value: `\`${event.method}\``,  inline: true },
                      { name: "Timestamp", value: `\`${now}\``,          inline: true },
    event.userAgent && { name: "User-Agent", value: `\`\`\`${event.userAgent}\`\`\``, inline: false },
  ].filter(Boolean) as { name: string; value: string; inline: boolean }[];

  const payload = {
    embeds: [{
      title: `${event.method ?? "POST"} ${event.url ?? "/auth/" + event.type}`,
      color,
      fields,
      footer: { text: `dwe.lol ${label} • ${new Date().toLocaleString("pt-BR")}` },
    }],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // silently ignore webhook failures
  }
}
