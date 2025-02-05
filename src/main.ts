import { invoke } from "@tauri-apps/api/core";
import { app } from "@tauri-apps/api";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;

async function greet() {
  if (greetMsgEl && greetInputEl) {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsgEl.textContent = await invoke("greet", {
      name: greetInputEl.value,
    });
  }
}

async function getVersionInfo() {
  // Get app version from Tauri
  const version = await app.getVersion();
  document.getElementById("app-version")!.textContent = version;
}

async function checkForUpdates() {
  const progressDiv = document.createElement("div");
  progressDiv.id = "update-progress";
  progressDiv.textContent = "Checking for updates...";
  document.body.appendChild(progressDiv);

  try {
    console.log("Starting update check...");
    console.log("Current version:", await app.getVersion());
    console.log(
      "Checking URL:",
      "https://github.com/edzzn/poc-tauri/releases/latest/download/latest.json"
    );

    const update = await check();
    console.log("Update check result:", update);
    console.log("Update check response:", JSON.stringify(update, null, 2));

    if (update) {
      // Show update dialog to user

      progressDiv.textContent = "Starting download...";

      // Add loading indicator and disable UI
      progressDiv.innerHTML = `
          <div class="spinner"></div>
          <div class="progress-text">Preparing update...</div>
        `;

      // Wrap in try/catch to handle installation errors
      try {
        let downloaded = 0;
        let contentLength = 0;
        await update.downloadAndInstall((progress) => {
          console.log("Download progress:", progress);
          const textElement = progressDiv.querySelector(".progress-text");

          switch (progress.event) {
            case "Started":
              contentLength = progress.data.contentLength ?? 0;
              if (textElement) textElement.textContent = "Preparing update...";
              break;
            case "Progress":
              downloaded += progress.data.chunkLength;
              console.log(`downloaded ${downloaded} from ${contentLength}`);
              break;
            case "Finished":
              if (textElement) textElement.textContent = "Verifying update...";
              break;
          }
        });

        // Only relaunch after successful installation
        console.log("Update installed, relaunching...");
        await relaunch();
      } catch (installError) {
        console.error("Installation failed:", installError);
        progressDiv.textContent = `Installation failed: ${installError instanceof Error
          ? installError.message
          : String(installError)
          }`;
      }
      // }
    } else {
      progressDiv.textContent = "You have the latest version!";
      setTimeout(() => progressDiv.remove(), 2000);
    }
  } catch (error) {
    console.error("Update check failed:", error);
    progressDiv.textContent = `Update check failed: ${error instanceof Error ? error.message : String(error)
      }`;
    setTimeout(() => progressDiv.remove(), 5000);
  }
}

// Add periodic check (every hour)
function startPeriodicUpdateCheck() {
  setInterval(checkForUpdates, 60 * 60 * 1000);
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
  getVersionInfo();

  // Check for updates on startup
  checkForUpdates();

  // Start periodic checks
  startPeriodicUpdateCheck();

  // Add a button for manual checks (if you want)
  const checkUpdateBtn = document.createElement("button");
  checkUpdateBtn.textContent = "Check for Updates";
  checkUpdateBtn.onclick = checkForUpdates;
  document.body.appendChild(checkUpdateBtn);
});
