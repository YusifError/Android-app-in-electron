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

import {
  createTask,
  updateTask,
  setTaskCompleted,
  deleteTask,
  type TaskInput
} from './database/tasks'

// =====================================
// ПРОВЕРКА ДАННЫХ СПИСКА
// =====================================

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

// =====================================
// ПРОВЕРКА ДАТ
// =====================================

function validateDateField(
  value: unknown,
  pattern: RegExp,
  fieldName: string
): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`Invalid ${fieldName}`)
  }

  return value
}

// =====================================
// ПРОВЕРКА ДАННЫХ ЗАДАЧИ
// =====================================

function validateTaskInput(
  input: unknown,
  depth = 0,
  counter = { count: 0 }
): TaskInput {
  if (
    depth > 10 ||
    ++counter.count > 200
  ) {
    throw new Error('Task nesting limit exceeded')
  }

  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid task data')
  }

  const data = input as Record<string, unknown>

  // Название
  if (
    typeof data.title !== 'string' ||
    data.title.trim().length === 0 ||
    data.title.length > 150
  ) {
    throw new Error('Invalid task title')
  }

  // Заметка
  const note = data.note ?? ''

  if (
    typeof note !== 'string' ||
    note.length > 10000
  ) {
    throw new Error('Invalid task note')
  }

  // Фотография
  let attachment: TaskInput['attachment'] = null

  if (data.attachment !== null && data.attachment !== undefined) {
    if (
      typeof data.attachment !== 'object' ||
      data.attachment === null
    ) {
      throw new Error('Invalid attachment')
    }

    const file = data.attachment as Record<string, unknown>

    if (
      typeof file.name !== 'string' ||
      typeof file.dataUrl !== 'string' ||
      file.name.length > 255 ||
      file.dataUrl.length > 7_000_000
    ) {
      throw new Error('Invalid attachment data')
    }

    attachment = {
      name: file.name,
      dataUrl: file.dataUrl
    }
  }

  // Подзадачи
  const subtasksValue = data.subtasks ?? []

  if (
    !Array.isArray(subtasksValue) ||
    subtasksValue.length > 100
  ) {
    throw new Error('Invalid subtasks')
  }

  // Статус выполнения
  if (
    data.isCompleted !== undefined &&
    typeof data.isCompleted !== 'boolean'
  ) {
    throw new Error('Invalid completion status')
  }

  // Срок выполнения
  const dueDate = validateDateField(
    data.dueDate,
    /^\d{4}-\d{2}-\d{2}$/,
    'due date'
  )

  // Напоминание
  const reminderAt = validateDateField(
    data.reminderAt,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    'reminder date'
  )

  return {
    title: data.title.trim(),
    note,

    // Если статус не передан, сохраняем undefined.
    // При редактировании это позволит оставить прежний статус.
    isCompleted: data.isCompleted === undefined
      ? undefined
      : data.isCompleted,

    attachment,
    dueDate,
    reminderAt,

    subtasks: subtasksValue.map(subtask =>
      validateTaskInput(subtask, depth + 1, counter)
    )
  }
}

// =====================================
// СОЗДАНИЕ ОКНА ELECTRON
// =====================================

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

// =====================================
// ЗАПУСК ПРИЛОЖЕНИЯ
// =====================================

app.whenReady().then(() => {
  try {
    // Инициализация SQLite
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

  // =====================================
  // IPC: СПИСКИ
  // =====================================

  // Получение всех списков
  ipcMain.handle(
    'database:task-lists:get-all',
    () => {
      return getTaskLists()
    }
  )

  // Создание списка
  ipcMain.handle(
    'database:task-lists:create',
    (_, input: unknown) => {
      const data = validateCreateTaskListInput(input)

      return createTaskList(data)
    }
  )

  // Удаление списка
  ipcMain.handle(
    'database:task-lists:delete',
    (_, id: unknown) => {
      if (
        typeof id !== 'string' ||
        !id.trim()
      ) {
        throw new Error('Invalid list ID')
      }

      return deleteTaskList(id)
    }
  )

  // =====================================
  // IPC: ЗАДАЧИ
  // =====================================

  // Создание задачи вместе с подзадачами
  ipcMain.handle(
    'database:tasks:create',
    (_, listId: unknown, input: unknown) => {
      if (
        typeof listId !== 'string' ||
        !listId.trim()
      ) {
        throw new Error('Invalid list ID')
      }

      const data = validateTaskInput(input)

      return createTask(listId, data)
    }
  )

  // Редактирование задачи вместе с подзадачами
  ipcMain.handle(
    'database:tasks:update',
    (_, listId: unknown, taskId: unknown, input: unknown) => {
      if (
        typeof listId !== 'string' ||
        !listId.trim() ||
        typeof taskId !== 'string' ||
        !taskId.trim()
      ) {
        throw new Error('Invalid task parameters')
      }

      const data = validateTaskInput(input)

      return updateTask(listId, taskId, data)
    }
  )

  // Изменение статуса задачи
  ipcMain.handle(
    'database:tasks:set-completed',
    (_, listId: unknown, taskId: unknown, completed: unknown) => {
      if (
        typeof listId !== 'string' ||
        typeof taskId !== 'string' ||
        typeof completed !== 'boolean'
      ) {
        throw new Error('Invalid task parameters')
      }

      return setTaskCompleted(listId, taskId, completed)
    }
  )

  // Удаление задачи вместе с подзадачами
  ipcMain.handle(
    'database:tasks:delete',
    (_, listId: unknown, taskId: unknown) => {
      if (
        typeof listId !== 'string' ||
        typeof taskId !== 'string'
      ) {
        throw new Error('Invalid task parameters')
      }

      return deleteTask(listId, taskId)
    }
  )

  // =====================================
  // ПРОЧИЕ НАСТРОЙКИ ELECTRON
  // =====================================

  ipcMain.on('ping', () => {
    console.log('pong')
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// =====================================
// ЗАКРЫТИЕ ПРИЛОЖЕНИЯ
// =====================================

app.on('before-quit', () => {
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})