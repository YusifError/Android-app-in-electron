import type { ElectronAPI } from '@electron-toolkit/preload'

// =====================================
// ТИПЫ ДАННЫХ API
// =====================================

// Фотография
interface ApiTaskAttachment {
  name: string
  dataUrl: string
}

// Задача, полученная из SQLite
interface ApiTask {
  id: string
  title: string
  isCompleted: boolean
  note: string
  attachment: ApiTaskAttachment | null
  subtasks: ApiTask[]
  dueDate: string | null
  reminderAt: string | null
}

// Список задач
interface ApiTaskList {
  id: string
  name: string
  color: string
  tasks: ApiTask[]
}

// Входные данные фотографии
interface ApiTaskAttachmentInput {
  name: string
  dataUrl: string
}

// Входные данные задачи
interface ApiTaskInput {
  title: string
  note?: string
  isCompleted?: boolean
  attachment?: ApiTaskAttachmentInput | null
  subtasks?: ApiTaskInput[]
  dueDate?: string | null
  reminderAt?: string | null
}

// Данные для создания и редактирования задачи
interface ApiTaskDraft {
  title: string
  note: string
  attachment: ApiTaskAttachmentInput | null
  subtasks: ApiTaskInput[]
  dueDate: string | null
  reminderAt: string | null
}

// =====================================
// DATABASE API
// =====================================

interface DatabaseAPI {
  database: {
    // =====================================
    // СПИСКИ
    // =====================================

    getTaskLists: () => Promise<ApiTaskList[]>

    createTaskList: (
      data: {
        name: string
        color: string
      }
    ) => Promise<ApiTaskList>

    deleteTaskList: (
      id: string
    ) => Promise<boolean>

    // =====================================
    // ЗАДАЧИ
    // =====================================

    createTask: (
      listId: string,
      data: ApiTaskDraft
    ) => Promise<ApiTask>

    updateTask: (
      listId: string,
      taskId: string,
      data: ApiTaskDraft
    ) => Promise<ApiTask | null>

    setTaskCompleted: (
      listId: string,
      taskId: string,
      isCompleted: boolean
    ) => Promise<boolean>

    deleteTask: (
      listId: string,
      taskId: string
    ) => Promise<boolean>
  }
}

// =====================================
// ГЛОБАЛЬНЫЕ ТИПЫ WINDOW
// =====================================

declare global {
  interface Window {
    electron: ElectronAPI
    api: DatabaseAPI
  }
}

export {}