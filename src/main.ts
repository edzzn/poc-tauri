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
  try {
    const update = await check()

    if (update) {
      // Show update dialog to user
      const shouldUpdate = await confirm(
        `Version ${update.version} is available! Would you like to install it now?\n\nRelease notes:\n${update.body}`
      )

      if (shouldUpdate) {
        const progressDiv = document.createElement('div')
        progressDiv.id = 'update-progress'
        document.body.appendChild(progressDiv)

        await update.downloadAndInstall((progress) => {
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
      }
    }
  } catch (error) {
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
  checkForUpdates();
});
