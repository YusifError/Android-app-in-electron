
import { useEffect, useState } from 'react'

import TopBar from './components/TopBar/TopBar'
import SideBarMenu from './components/TopBar/SideBarMenu/SideBarMenu'
import MainContent from './components/MainContent/MainContent'

import type {
  TaskDraft,
  TaskList
} from './components/TopBar/SideBarMenu/SideBarMenu.types'

import type { CreateListData } from './components/TopBar/SideBarMenu/CreateListModal/CreateListModal'

function App(): React.JSX.Element {
  // Состояние бокового меню
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  // Все списки приложения
  const [taskLists, setTaskLists] = useState<TaskList[]>([])

  // ID выбранного списка
  const [activeListId, setActiveListId] = useState<string | null>(null)

  // =====================================
  // ЗАГРУЗКА ДАННЫХ
  // =====================================

  useEffect(() => {
    let isMounted = true

    const loadData = async (): Promise<void> => {
      try {
        const lists = await window.api.database.getTaskLists()

        if (isMounted) {
          setTaskLists(lists)
        }
      } catch (error) {
        console.error('Failed to load data:', error)

        if (isMounted) {
          window.alert('Не удалось загрузить данные.')
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  // =====================================
  // SIDEBAR
  // =====================================

  // Открытие и закрытие меню
  const toggleMenu = (): void => {
    setIsMenuOpen(prev => !prev)
  }

  // Выбор списка
  const handleSelectList = (id: string): void => {
    setActiveListId(id)
    setIsMenuOpen(false)
  }

  // Возвращение на главный экран
  const handleGoHome = (): void => {
    setActiveListId(null)
    setIsMenuOpen(false)
  }

  // =====================================
  // СПИСКИ
  // =====================================

  // Создание списка
  const handleCreateList = async (
    data: CreateListData
  ): Promise<void> => {
    try {
      const newList = await window.api.database.createTaskList(data)

      setTaskLists(prev => [...prev, newList])
      setActiveListId(newList.id)

    } catch (error) {
      console.error('Failed to create list:', error)
      window.alert('Не удалось создать список.')
    }
  }

  // Удаление списка
  const handleDeleteList = async (id: string): Promise<void> => {
    try {
      const deleted = await window.api.database.deleteTaskList(id)

      if (!deleted) return

      setTaskLists(prev =>
        prev.filter(list => list.id !== id)
      )

      // Если удалили открытый список,
      // возвращаемся на главный экран
      setActiveListId(prev =>
        prev === id ? null : prev
      )

    } catch (error) {
      console.error('Failed to delete list:', error)
      window.alert('Не удалось удалить список.')
    }
  }

  // =====================================
  // ЗАДАЧИ
  // =====================================

  // Создание задачи
  const handleCreateTask = async (
    listId: string,
    data: TaskDraft
  ): Promise<void> => {
    try {
      // Сохраняем задачу в SQLite
      const newTask = await window.api.database.createTask(
        listId,
        data
      )

      // Обновляем состояние React
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

    } catch (error) {
      console.error('Failed to create task:', error)

      // Передаём ошибку в TaskEditor
      throw error
    }
  }

  // Изменение статуса задачи
  const handleToggleTask = async (
    listId: string,
    taskId: string
  ): Promise<void> => {
    // Находим задачу в текущем состоянии
    const list = taskLists.find(item => item.id === listId)
    const task = list?.tasks.find(item => item.id === taskId)

    if (!task) return

    const newCompletedStatus = !task.isCompleted

    try {
      // Обновляем статус в SQLite
      const updated = await window.api.database.setTaskCompleted(
        listId,
        taskId,
        newCompletedStatus
      )

      if (!updated) return

      // Обновляем React state
      setTaskLists(prev =>
        prev.map(item =>
          item.id === listId
            ? {
                ...item,
                tasks: item.tasks.map(currentTask =>
                  currentTask.id === taskId
                    ? {
                        ...currentTask,
                        isCompleted: newCompletedStatus
                      }
                    : currentTask
                )
              }
            : item
        )
      )

    } catch (error) {
      console.error('Failed to update task:', error)
      window.alert('Не удалось обновить задачу.')
    }
  }

  // Удаление задачи
  const handleDeleteTask = async (
    listId: string,
    taskId: string
  ): Promise<void> => {
    try {
      // Удаляем задачу из SQLite
      const deleted = await window.api.database.deleteTask(
        listId,
        taskId
      )

      if (!deleted) return

      // Обновляем React state
      setTaskLists(prev =>
        prev.map(list =>
          list.id === listId
            ? {
                ...list,
                tasks: list.tasks.filter(
                  task => task.id !== taskId
                )
              }
            : list
        )
      )

    } catch (error) {
      console.error('Failed to delete task:', error)
      window.alert('Не удалось удалить задачу.')
    }
  }

  // =====================================
  // АКТИВНЫЙ СПИСОК
  // =====================================

  const activeList = taskLists.find(
    list => list.id === activeListId
  ) ?? null

  // =====================================
  // RENDER
  // =====================================

  return (
    <>
      <TopBar
        onMenuClick={toggleMenu}
      />

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
