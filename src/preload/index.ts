
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  database: {
    // Получить все списки
    getTaskLists: () => {
      return ipcRenderer.invoke('database:task-lists:get-all')
    },

    // Создать список
    createTaskList: (data: { name: string; color: string }) => {
      return ipcRenderer.invoke('database:task-lists:create', data)
    },

    // Удалить список
    deleteTaskList: (id: string) => {
      return ipcRenderer.invoke('database:task-lists:delete', id)
    }
  }
}

// Передаём безопасный API в Renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI

  // @ts-ignore
  window.api = api
}
