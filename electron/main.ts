// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

let mainWindow: BrowserWindow;

app.whenReady().then(() => {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    // 开发模式
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：electron-builder 会将 out 目录打包到 resources/app.asar 中
    // __dirname 在生产模式下指向 resources/app.asar/out/main/
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    console.log('Loading HTML from:', htmlPath);
    console.log('App path:', app.getAppPath());
    console.log('__dirname:', __dirname);

    // 临时打开开发者工具以便调试黑屏问题
    mainWindow.webContents.openDevTools();

    // 监听页面加载事件
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Page failed to load:', errorCode, errorDescription, validatedURL);
    });

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page finished loading');
      // 检查是否有 JavaScript 错误
      mainWindow.webContents.executeJavaScript(`
        console.log('Page loaded, checking for errors...');
        if (typeof window !== 'undefined') {
          console.log('Window object exists');
          if (document.getElementById('root')) {
            console.log('Root element exists');
          } else {
            console.error('Root element NOT found!');
          }
        }
      `).catch((err) => console.error('Error executing JavaScript:', err));
    });

    mainWindow.webContents.on('console-message', (event, level, message) => {
      console.log(`[Renderer ${level}]:`, message);
    });

    mainWindow.loadFile(htmlPath).catch((err) => {
      console.error('Failed to load HTML file:', err);
      console.error('Attempted path:', htmlPath);
    });
  }
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

ipcMain.on('write-data-file', (event, content) => {
  const filePath = path.join(app.getAppPath(), 'datafile.json');
  fs.writeFileSync(filePath, content);
});
