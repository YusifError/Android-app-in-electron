
import { useEffect, useState } from 'react'

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

  // Списки приложения
  const [taskLists, setTaskLists] = useState<TaskList[]>([])

  // Выбранный список
  const [activeListId, setActiveListId] = useState<string | null>(null)

  // Загрузка данных из SQLite при запуске
  useEffect(() => {
    let isMounted = true

    const loadTaskLists = async (): Promise<void> => {
      try {
        const lists = await window.api.database.getTaskLists()

        if (isMounted) {
          setTaskLists(lists)
        }
      } catch (error) {
        console.error('Failed to load task lists:', error)

        if (isMounted) {
          window.alert('Не удалось загрузить списки из базы данных.')
        }
      }
    }

    loadTaskLists()

    return () => {
      isMounted = false
    }
  }, [])

  // Открытие Sidebar
  const toggleMenu = (): void => {
    setIsMenuOpen(prev => !prev)
  }

  // Создание списка в SQLite
  const handleCreateList = async (data: CreateListData): Promise<void> => {
    try {
      const newList = await window.api.database.createTaskList(data)

      setTaskLists(prev => [...prev, newList])
      setActiveListId(newList.id)
    } catch (error) {
      console.error('Failed to create task list:', error)
      window.alert('Не удалось создать список.')
    }
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

  // Удаление списка из SQLite
  const handleDeleteList = async (id: string): Promise<void> => {
    try {
      const deleted = await window.api.database.deleteTaskList(id)

      if (!deleted) return

      setTaskLists(prev => prev.filter(list => list.id !== id))

      setActiveListId(prev => prev === id ? null : prev)
    } catch (error) {
      console.error('Failed to delete task list:', error)
      window.alert('Не удалось удалить список.')
    }
  }

  // Создание задачи (пока только в React state)
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

    setActiveListId(listId)
  }

  // Изменение статуса задачи (пока только в React state)
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

  // Удаление задачи (пока только в React state)
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

  // Получаем активный список
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
