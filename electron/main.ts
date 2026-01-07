// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

let mainWindow: BrowserWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js')
    }
  });

  mainWindow.loadURL('http://localhost:5173');
});

ipcMain.handle('run-load-test', async (_event, config) => {
  console.log(config);
  return new Promise((resolve, reject) => {
    const child = spawn(path.join(__dirname, '..', 'loadtester'));
    child.stdin.write(JSON.stringify(config));
    child.stdin.end();

    let output = '';
    child.stdout.on('data', (data) => (output += data));
    child.stderr.on('data', (data) => console.error(data.toString()));
    child.on('close', () => {
      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        console.error('Output was:', output);
        reject(err);
      }
    });
  });
});

ipcMain.handle('read-data-file', () => {
  const filePath = path.join(app.getAppPath(), 'datafile.json');
  return fs.readFileSync(filePath, 'utf8');
});

// ipcMain.on('write-data-file', (event, content) => {
//   fs.writeFileSync(path.join(__dirname, '../datafile.json'), content);
// });
