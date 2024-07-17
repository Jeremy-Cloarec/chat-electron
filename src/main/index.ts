import { app, shell, BrowserWindow, ipcMain, Tray, Notification } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { Message } from '../type/Message'
import { io } from 'socket.io-client'
import path from 'path'

const socket = io('http://localhost:3500')

let mainWindow1: BrowserWindow
let mainWindow2: BrowserWindow

let tray: Tray

function createWindow(): void {
  // Create the first browser window.
  mainWindow1 = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow1.on('ready-to-show', () => {
    mainWindow1.show()
  })

  mainWindow1.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow1.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow1.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Create the second browser window.
  mainWindow2 = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow2.on('ready-to-show', () => {
    mainWindow2.show()
  })

  mainWindow2.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow2.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow2.loadFile(join(__dirname, '../renderer/index.html'))
  }

  const handleMessage = (message: unknown) => {
    console.log('Received message', message)
    mainWindow1.webContents.send('socket-message', message)
    mainWindow2.webContents.send('socket-message', message)
  }

  socket.on('message', handleMessage)

  mainWindow1.on('close', () => {
    socket.off('message', handleMessage)
  })

  mainWindow2.on('close', () => {
    socket.off('message', handleMessage)
  })

  ipcMain.on('socket-message', (_, message: Message) => {
    socket.emit('message', message)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  tray = new Tray('C:\dev\chat-electron')
  tray.setToolTip('Your App Name')

  ipcMain.on('new-message', (event, message) => {
    showNotification(message)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function showNotification(message: any) {
  const notification = new Notification({
    title: 'New Message',
    body: message,
    icon: path.join('C:\dev\chat-electron', 'icon.png')
  })

  notification.show()
}
