
import type { ElectronAPI } from '@electron-toolkit/preload'

import type { TaskList } from '../renderer/src/components/TopBar/SideBarMenu/SideBarMenu.types'

interface DatabaseAPI {
  database: {
    getTaskLists: () => Promise<TaskList[]>

    createTaskList: (data: {
      name: string
      color: string
    }) => Promise<TaskList>

    deleteTaskList: (id: string) => Promise<boolean>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DatabaseAPI
  }
}

export {}
