// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

let mainWindow: BrowserWindow;

// 获取数据文件路径（存储在用户数据目录，可写）
function getDataFilePath(): string {
  return path.join(app.getPath('userData'), 'datafile.json');
}

// 初始化数据文件：如果不存在，尝试从应用目录复制，否则创建默认文件
function initializeDataFile(): void {
  const userDataPath = getDataFilePath();
  const appDataPath = path.join(app.getAppPath(), 'datafile.json');

  // 确保用户数据目录存在
  const userDataDir = path.dirname(userDataPath);
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // 如果用户数据目录中的文件不存在
  if (!fs.existsSync(userDataPath)) {
    // 尝试从应用目录复制（开发模式或首次安装时可能有）
    if (fs.existsSync(appDataPath)) {
      try {
        fs.copyFileSync(appDataPath, userDataPath);
        if (!app.isPackaged) {
          console.log('Copied datafile.json from app directory to user data directory');
        }
      } catch (err) {
        console.error('Failed to copy datafile.json:', err);
        // 如果复制失败，创建默认文件
        fs.writeFileSync(userDataPath, JSON.stringify([], null, 2));
      }
    } else {
      // 创建默认的空数组文件
      fs.writeFileSync(userDataPath, JSON.stringify([], null, 2));
      if (!app.isPackaged) {
        console.log('Created default datafile.json in user data directory');
      }
    }
  }
}

app.whenReady().then(() => {
  // 初始化数据文件
  initializeDataFile();

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

    // 监听页面加载失败事件（仅用于错误诊断）
    mainWindow.webContents.on(
      'did-fail-load',
      (event, errorCode, errorDescription, validatedURL) => {
        console.error('Page failed to load:', errorCode, errorDescription, validatedURL);
      }
    );

    mainWindow.loadFile(htmlPath).catch((err) => {
      console.error('Failed to load HTML file:', err);
    });
  }
});

// 获取 loadtester 二进制文件的路径
// 在生产模式下，由于 asarUnpack，二进制文件在 app.asar.unpacked 目录中
function getLoadtesterPath(): string {
  const binaryName = process.platform === 'win32' ? 'loadtester.exe' : 'loadtester';
  if (app.isPackaged) {
    // 生产模式：__dirname 指向 resources/app.asar/out/main/
    // 解压后的文件在 resources/app.asar.unpacked/out/loadtester
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'out', binaryName);
  } else {
    // 开发模式：直接使用相对路径
    return path.join(__dirname, '..', binaryName);
  }
}

ipcMain.handle('run-load-test', async (_event, config) => {
  if (!app.isPackaged) {
    console.log(config);
  }
  return new Promise((resolve, reject) => {
    const loadtesterPath = getLoadtesterPath();
    if (!app.isPackaged) {
      console.log('Spawning loadtester from:', loadtesterPath);
    }
    const child = spawn(loadtesterPath);
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
  const filePath = getDataFilePath();
  // 确保文件存在
  if (!fs.existsSync(filePath)) {
    initializeDataFile();
  }
  return fs.readFileSync(filePath, 'utf8');
});

ipcMain.on('write-data-file', (event, content) => {
  const filePath = getDataFilePath();
  try {
    fs.writeFileSync(filePath, content);
  } catch (err) {
    console.error('Failed to write datafile.json:', err);
    event.reply('write-data-file-error', err);
  }
});
