console.log("QuickExplain background.js loaded");

const api = typeof browser !== "undefined" ? browser : chrome;

// Debouncing: prevent concurrent requests
let inFlight = false;

/* -------------------- MESSAGE HANDLER -------------------- */

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "EXPLAIN_TEXT") return;

  console.log("[Background] Received EXPLAIN_TEXT:", msg.text);

  // Debounce: reject if request already in flight
  if (inFlight) {
    console.log("[Background] Ignoring request (already in flight)");
    sendResponse({
      explanation: "Please wait for the previous explanation to finish."
    });
    return true;
  }

  inFlight = true;
  const text = msg.text.trim();
  const context = msg.context || undefined;

  // Call backend endpoint
  callBackendExplain(text, context)
    .then((response) => {
      console.log("[Background] Backend response:", response);
      sendResponse(response);
    })
    .catch((error) => {
      console.error("[Background] Backend call failed:", error);
      sendResponse({
        explanation: "Sorry, I couldn't explain this clearly. Please try again."
      });
    })
    .finally(() => {
      inFlight = false;
      console.log("[Background] Request completed");
    });

  // Keep message channel open for async response
  return true;
});

/* -------------------- BACKEND API CALL -------------------- */

function callBackendExplain(text, context) {
  const backendUrl = "https://extension-quickexplain.up.railway.app/explain";

  console.log("[Background] Calling backend:", backendUrl);

  return fetch(backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      context: context || null,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("[Background] Fetch error:", error);
      throw error;
    });
}
