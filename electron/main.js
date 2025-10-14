const { app, BrowserWindow } = require("electron");
const path = require("path");
const { exec } = require("child_process");

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  const appURL = isDev
    ? "http://localhost:3000"
    : "http://localhost:3000"; // still uses Next.js server

  win.loadURL(appURL);
}

app.whenReady().then(() => {
  if (!isDev) {
    // 🚀 Start the Next.js server before loading Electron
    const nextProcess = exec("npm run start");

    nextProcess.stdout.on("data", (data) => console.log(data.toString()));
    nextProcess.stderr.on("data", (data) => console.error(data.toString()));

    // Wait a few seconds for the server to start
    setTimeout(() => {
      createWindow();
    }, 5000); // 5 seconds delay
  } else {
    createWindow();
  }
});
