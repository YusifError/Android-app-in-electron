import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// =====================================
// ТИПЫ ДАННЫХ
// =====================================

// Фотография
interface TaskAttachmentInput {
  name: string
  dataUrl: string
}

// Данные задачи
interface TaskInput {
  title: string
  note?: string
  isCompleted?: boolean
  attachment?: TaskAttachmentInput | null
  subtasks?: TaskInput[]
  dueDate?: string | null
  reminderAt?: string | null
}

// Данные новой или редактируемой задачи
interface TaskDraftInput extends TaskInput {
  note: string
  attachment: TaskAttachmentInput | null
  subtasks: TaskInput[]
  dueDate: string | null
  reminderAt: string | null
}

// =====================================
// API ДЛЯ SQLITE
// =====================================

const api = {
  database: {
    // =====================================
    // СПИСКИ
    // =====================================

    // Получение всех списков
    getTaskLists: () => {
      return ipcRenderer.invoke(
        'database:task-lists:get-all'
      )
    },

    // Создание списка
    createTaskList: (
      data: {
        name: string
        color: string
      }
    ) => {
      return ipcRenderer.invoke(
        'database:task-lists:create',
        data
      )
    },

    // Удаление списка
    deleteTaskList: (id: string) => {
      return ipcRenderer.invoke(
        'database:task-lists:delete',
        id
      )
    },

    // =====================================
    // ЗАДАЧИ
    // =====================================

    // Создание задачи
    createTask: (
      listId: string,
      data: TaskDraftInput
    ) => {
      return ipcRenderer.invoke(
        'database:tasks:create',
        listId,
        data
      )
    },

    // Редактирование существующей задачи
    updateTask: (
      listId: string,
      taskId: string,
      data: TaskDraftInput
    ) => {
      return ipcRenderer.invoke(
        'database:tasks:update',
        listId,
        taskId,
        data
      )
    },

    // Изменение статуса выполнения задачи
    setTaskCompleted: (
      listId: string,
      taskId: string,
      isCompleted: boolean
    ) => {
      return ipcRenderer.invoke(
        'database:tasks:set-completed',
        listId,
        taskId,
        isCompleted
      )
    },

    // Удаление задачи
    deleteTask: (
      listId: string,
      taskId: string
    ) => {
      return ipcRenderer.invoke(
        'database:tasks:delete',
        listId,
        taskId
      )
    }
  }
}

// =====================================
// ПЕРЕДАЧА API В RENDERER
// =====================================

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose API:', error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI

  // @ts-ignore
  window.api = api
}