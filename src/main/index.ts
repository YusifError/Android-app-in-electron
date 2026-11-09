
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import {
  initializeDatabase,
  closeDatabase
} from './database/db'

import {
  getTaskLists,
  createTaskList,
  deleteTaskList
} from './database/taskLists'

// Проверка входных данных для создания списка
function validateCreateTaskListInput(
  input: unknown
): { name: string; color: string } {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid list data')
  }

  const data = input as Record<string, unknown>

  if (
    typeof data.name !== 'string' ||
    typeof data.color !== 'string'
  ) {
    throw new Error('Invalid list properties')
  }

  return {
    name: data.name,
    color: data.color
  }
}

// Создание окна приложения
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,

    titleBarStyle: 'hidden',

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)

    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  try {
    // Подключение SQLite
    initializeDatabase()
  } catch (error) {
    console.error('Failed to initialize SQLite:', error)

    app.quit()
    return
  }

  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  optimizer.registerFramelessWindowIpc()

  // IPC: получение списков
  ipcMain.handle('database:task-lists:get-all', () => {
    return getTaskLists()
  })

  // IPC: создание списка
  ipcMain.handle('database:task-lists:create', (_event, input: unknown) => {
    const data = validateCreateTaskListInput(input)

    return createTaskList(data)
  })

  // IPC: удаление списка
  ipcMain.handle('database:task-lists:delete', (_event, id: unknown) => {
    if (typeof id !== 'string' || !id.trim()) {
      throw new Error('Invalid list ID')
    }

    return deleteTaskList(id)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Закрытие подключения к базе
app.on('before-quit', () => {
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
