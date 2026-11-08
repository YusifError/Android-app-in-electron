
import React, { useState } from 'react'
import './MainContent.css'

import Versions from '../Versions'

import type { TaskList } from '../TopBar/SideBarMenu/SideBarMenu.types'

interface MainContentProps {
  activeList: TaskList | null
  onAddTask: (title: string) => void
  onToggleTask: (taskId: string) => void
}

function MainContent({
  activeList,
  onAddTask,
  onToggleTask
}: MainContentProps): React.JSX.Element {
  const [taskTitle, setTaskTitle] = useState('')

  // Создание задачи
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    const trimmedTitle = taskTitle.trim()

    if (!trimmedTitle) return

    onAddTask(trimmedTitle)
    setTaskTitle('')
  }

  // Если список не выбран, показываем главный экран
  if (!activeList) {
    return <Versions />
  }

  return (
    <main className="main-content">

      {/* Заголовок списка */}
      <div className="main-content__header">
        <span
          className="main-content__color"
          style={{ backgroundColor: activeList.color }}
        />

        <h1>{activeList.name}</h1>
      </div>

      {/* Форма создания задачи */}
      <form
        className="main-content__add-form"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Новая задача"
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          maxLength={150}
        />

        <button
          type="submit"
          disabled={!taskTitle.trim()}
        >
          Добавить
        </button>
      </form>

      {/* Список задач */}
      <div className="main-content__tasks">

        {activeList.tasks.length === 0 ? (
          <p className="main-content__empty">
            В этом списке пока нет задач.
          </p>
        ) : (
          activeList.tasks.map(task => (
            <label
              key={task.id}
              className={`main-content__task ${
                task.isCompleted
                  ? 'main-content__task--completed'
                  : ''
              }`}
            >
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={() => onToggleTask(task.id)}
              />

              <span>{task.title}</span>
            </label>
          ))
        )}

      </div>
    </main>
  )
}

export default MainContent
