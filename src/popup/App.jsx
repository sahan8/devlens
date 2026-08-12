/* global chrome */

import "./App.css";

function App() {
  const startInspecting = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        console.log("No active tab found");
        return;
      }

      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
        },
        files: [
  "explainer.js",
  "inspector.js"
],
      });

      window.close();
    } catch (error) {
      console.error("DevLens Error:", error);
    }
  };

  return (
    <div className="devlens">
      <h1>🔍 DevLens</h1>

      <p>
        Inspect elements and understand their CSS styles.
      </p>

      <button onClick={startInspecting}>
        Start Inspecting
      </button>
    </div>
  );
}

export default App;
