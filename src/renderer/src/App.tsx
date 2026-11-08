
import { useState } from 'react'

import TopBar from './components/TopBar/TopBar'
import SideBarMenu from './components/TopBar/SideBarMenu/SideBarMenu'
import MainContent from './components/MainContent/MainContent'

import type { Task, TaskList } from './components/TopBar/SideBarMenu/SideBarMenu.types'

import type { CreateListData } from './components/TopBar/SideBarMenu/CreateListModal/CreateListModal'

function App(): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  // Все созданные списки
  const [taskLists, setTaskLists] = useState<TaskList[]>([])

  // ID выбранного списка
  const [activeListId, setActiveListId] = useState<string | null>(null)

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

  // Добавление задачи в активный список
  const handleAddTask = (title: string): void => {
    if (!activeListId) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      isCompleted: false
    }

    setTaskLists(prev =>
      prev.map(list =>
        list.id === activeListId
          ? {
              ...list,
              tasks: [...list.tasks, newTask]
            }
          : list
      )
    )
  }

  // Изменение статуса задачи
  const handleToggleTask = (taskId: string): void => {
    if (!activeListId) return

    setTaskLists(prev =>
      prev.map(list =>
        list.id === activeListId
          ? {
              ...list,
              tasks: list.tasks.map(task =>
                task.id === taskId
                  ? { ...task, isCompleted: !task.isCompleted }
                  : task
              )
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
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
      />
    </>
  )
}

export default App
