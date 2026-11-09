
import { useState } from 'react'

import TopBar from './components/TopBar/TopBar'
import SideBarMenu from './components/TopBar/SideBarMenu/SideBarMenu'
import MainContent from './components/MainContent/MainContent'

import type {
  Task,
  TaskDraft,
  TaskList
} from './components/TopBar/SideBarMenu/SideBarMenu.types'

import type { CreateListData } from './components/TopBar/SideBarMenu/CreateListModal/CreateListModal'

function App(): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  // Все созданные списки
  const [taskLists, setTaskLists] = useState<TaskList[]>([])

  // ID выбранного списка
  const [activeListId, setActiveListId] = useState<string | null>(null)

  // Открытие и закрытие Sidebar
  const toggleMenu = (): void => {
    setIsMenuOpen(prev => !prev)
  }

  // Создание списка
  const handleCreateList = (data: CreateListData): void => {
    const newList: TaskList = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color,
      tasks: []
    }

    setTaskLists(prev => [...prev, newList])
    setActiveListId(newList.id)
  }

  // Выбор списка
  const handleSelectList = (id: string): void => {
    setActiveListId(id)
    setIsMenuOpen(false)
  }

  // Возврат на главный экран
  const handleGoHome = (): void => {
    setActiveListId(null)
    setIsMenuOpen(false)
  }

  // Удаление списка
  const handleDeleteList = (id: string): void => {
    setTaskLists(prev => prev.filter(list => list.id !== id))

    setActiveListId(prev => prev === id ? null : prev)
  }

  // Создание задачи в выбранном списке
  const handleCreateTask = (
    listId: string,
    data: TaskDraft
  ): void => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...data,
      isCompleted: false
    }

    setTaskLists(prev =>
      prev.map(list =>
        list.id === listId
          ? {
              ...list,
              tasks: [...list.tasks, newTask]
            }
          : list
      )
    )

    // Открываем список, в который добавили задачу
    setActiveListId(listId)
  }

  // Изменение статуса задачи
  const handleToggleTask = (
    listId: string,
    taskId: string
  ): void => {
    setTaskLists(prev =>
      prev.map(list =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map(task =>
                task.id === taskId
                  ? {
                      ...task,
                      isCompleted: !task.isCompleted
                    }
                  : task
              )
            }
          : list
      )
    )
  }

  // Удаление задачи
  const handleDeleteTask = (
    listId: string,
    taskId: string
  ): void => {
    setTaskLists(prev =>
      prev.map(list =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.filter(task => task.id !== taskId)
            }
          : list
      )
    )
  }

  // Получение активного списка
  const activeList = taskLists.find(
    list => list.id === activeListId
  ) ?? null

  return (
    <>
      <TopBar onMenuClick={toggleMenu} />

      <SideBarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        taskLists={taskLists}
        activeListId={activeListId}
        onSelectList={handleSelectList}
        onCreateList={handleCreateList}
        onGoHome={handleGoHome}
        onDeleteList={handleDeleteList}
      />

      <MainContent
        activeList={activeList}
        taskLists={taskLists}
        onCreateTask={handleCreateTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />
    </>
  )
}

export default App
