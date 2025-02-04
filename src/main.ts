import { invoke } from "@tauri-apps/api/core";
import { app } from '@tauri-apps/api';
import { check } from '@tauri-apps/plugin-updater'

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
  document.getElementById('app-version')!.textContent = version;
}

async function checkForUpdates() {
  const progressDiv = document.createElement('div')
  progressDiv.id = 'update-progress'
  progressDiv.textContent = 'Checking for updates...'
  document.body.appendChild(progressDiv)

  try {
    console.log('Starting update check...')
    console.log('Current version:', await app.getVersion())
    console.log('Checking URL:', 'https://github.com/edzzn/poc-tauri/releases/latest/download/latest.json')

    const update = await check()
    console.log('Update check result:', update)
    console.log('Update check response:', JSON.stringify(update, null, 2))

    if (update) {
      // Show update dialog to user
      const shouldUpdate = await confirm(
        `Version ${update.version} is available! Would you like to install it now?\n\nRelease notes:\n${update.body}`
      )

      if (shouldUpdate) {
        progressDiv.textContent = 'Starting download...'

        await update.downloadAndInstall((progress) => {
          console.log('Download progress:', progress)
          switch (progress.event) {
            case 'Started':
              progressDiv.textContent = 'Preparing update...'
              break
            case 'Progress':
              progressDiv.textContent = `Downloading update...`
              break
            case 'Finished':
              progressDiv.textContent = 'Update downloaded! Restarting...'
              break
          }
        })
      } else {
        progressDiv.remove()
      }
    } else {
      progressDiv.textContent = 'You have the latest version!'
      setTimeout(() => progressDiv.remove(), 2000)
    }
  } catch (error) {
    console.error('Update check failed:', error)
    progressDiv.textContent = `Update check failed: ${error instanceof Error ? error.message : String(error)}`
    setTimeout(() => progressDiv.remove(), 5000)
  }
}

// Add periodic check (every hour)
function startPeriodicUpdateCheck() {
  setInterval(checkForUpdates, 60 * 60 * 1000);
}

// Add manual check function
async function manualCheckForUpdates() {
  const progressDiv = document.createElement('div')
  progressDiv.id = 'update-progress'
  progressDiv.textContent = 'Checking for updates...'
  document.body.appendChild(progressDiv)

  try {
    const update = await check()
    if (!update) {
      progressDiv.textContent = 'You have the latest version!'
      setTimeout(() => progressDiv.remove(), 2000)
    }
  } catch (error) {
    progressDiv.textContent = 'Error checking for updates'
    setTimeout(() => progressDiv.remove(), 2000)
    console.error('Update error:', error)
  }
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
  const checkUpdateBtn = document.createElement('button')
  checkUpdateBtn.textContent = 'Check for Updates'
  checkUpdateBtn.onclick = checkForUpdates
  document.body.appendChild(checkUpdateBtn)
});
