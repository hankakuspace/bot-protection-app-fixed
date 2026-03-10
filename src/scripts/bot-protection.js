// src/scripts/bot-protection.js
(async () => {
  try {
    const res = await fetch(
      "https://bot-protection-app-fixed.vercel.app/api/verify-ip",
      {
        method: "POST",
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return;
    }

    const result = await res.json();

    if (result.blocked) {
      window.location.href =
        "https://bot-protection-app-fixed.vercel.app/blocked";
    }
  } catch (e) {
    console.error("Bot protection error", e);
  }
})();
