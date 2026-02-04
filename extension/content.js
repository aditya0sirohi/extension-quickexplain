console.log("QuickExplain content.js loaded");

const api = typeof browser !== "undefined" ? browser : chrome;

let tooltip = null;
let enabled = true;

/* -------------------- ENABLE / DISABLE -------------------- */

api.storage.local.get(["enabled"], (res) => {
  enabled = res.enabled !== false; // default true
});

api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.enabled) {
    enabled = changes.enabled.newValue;
    if (!enabled) removeTooltip();
  }
});

/* -------------------- SELECTION HANDLING -------------------- */

document.addEventListener("mouseup", () => {
  if (!enabled) return;

  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (!text || text.length === 0) {
    removeTooltip();
    return;
  }

  // Reject selections longer than 120 characters
  if (text.length > 120) {
    showTooltip(null, "Please select a word or short phrase.");
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  showTooltip(rect, "Loading...");

  // Extract surrounding context (±300 chars around selection)
  const context = extractContext(range, 300);

  console.log("[Content] Tooltip created for text:", text);
  console.log("[Content] Surrounding context:", context);
  console.log("[Content] Sending EXPLAIN_TEXT message:", text);

  api.runtime.sendMessage({ 
    type: "EXPLAIN_TEXT", 
    text: text,
    context: context
  })
    .then((response) => {
      console.log("[Content] Raw response object:", response);
      console.log("[Content] Response type:", typeof response);
      console.log("[Content] Response keys:", response ? Object.keys(response) : "null");
      console.log("[Content] Explanation field value:", response?.explanation);
      console.log("[Content] Tooltip DOM exists?", tooltip !== null);
      
      if (!response) {
        console.error("[Content] Response is null or undefined");
        updateTooltip("Could not explain text.");
        return;
      }

      if (!response.explanation) {
        console.error("[Content] Response has no explanation field. Response keys:", Object.keys(response));
        updateTooltip("Could not explain text.");
        return;
      }

      console.log("[Content] About to update tooltip with explanation:", response.explanation);
      console.log("[Content] Tooltip exists before update?", tooltip !== null);
      updateTooltip(response.explanation);
      console.log("[Content] Tooltip updated. Current text:", tooltip?.textContent);
    })
    .catch((error) => {
      console.error("[Content] Message send failed with error:", error);
      updateTooltip("Could not explain text.");
    });
});

/* -------------------- TOOLTIP UI -------------------- */

function showTooltip(rect, text) {
  removeTooltip();

  tooltip = document.createElement("div");
  tooltip.id = "quickexplain-tooltip";
  tooltip.textContent = text;

  document.body.appendChild(tooltip);

  const top = rect.top + window.scrollY - tooltip.offsetHeight - 8;
  const left = rect.left + window.scrollX;

  tooltip.style.top = `${Math.max(top, 8)}px`;
  tooltip.style.left = `${left}px`;

  setTimeout(() => {
    document.addEventListener("mousedown", outsideClickListener);
  }, 0);
}

function updateTooltip(text) {
  console.log("[Tooltip] updateTooltip called with text:", text);
  console.log("[Tooltip] tooltip variable is:", tooltip);
  if (!tooltip) {
    console.error("[Tooltip] Tooltip DOM node is null/removed. Cannot update.");
    return;
  }
  console.log("[Tooltip] Before update - tooltip.textContent:", tooltip.textContent);
  tooltip.textContent = text;
  console.log("[Tooltip] After update - tooltip.textContent:", tooltip.textContent);
}

function removeTooltip() {
  console.log("[Tooltip] removeTooltip called. Current tooltip:", tooltip);
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
    document.removeEventListener("mousedown", outsideClickListener);
    console.log("[Tooltip] Tooltip removed and cleaned up");
  }
}

function outsideClickListener(e) {
  console.log("[Tooltip] outsideClickListener fired. Tooltip exists?", tooltip !== null);
  if (tooltip && !tooltip.contains(e.target)) {
    console.log("[Tooltip] Click outside tooltip detected. Removing.");
    removeTooltip();
  }
}
/* -------------------- CONTEXT EXTRACTION -------------------- */

function extractContext(range, charCount) {
  try {
    const preRange = range.cloneRange();
    preRange.collapse(true);
    preRange.setStart(document.body, 0);
    const preText = preRange.toString();
    const preContext = preText.slice(Math.max(0, preText.length - charCount));

    const postRange = range.cloneRange();
    postRange.collapse(false);
    postRange.setEnd(document.body, document.body.childNodes.length);
    const postText = postRange.toString();
    const postContext = postText.slice(0, charCount);

    return (preContext + postContext).trim();
  } catch (error) {
    console.log("[Context] Failed to extract context:", error);
    return "";
  }
}