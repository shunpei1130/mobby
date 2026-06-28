async function submitLead(payload) {
  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "送信に失敗しました");
    return data;
  } catch (error) {
    console.error("[Mobby MBTI] lead failed:", error);
    throw error;
  }
}

async function submitDiagnosis(payload) {
  try {
    const response = await fetch("/api/diagnosis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "保存に失敗しました");
    return data;
  } catch (error) {
    console.error("[Mobby MBTI] diagnosis failed:", error);
    throw error;
  }
}
