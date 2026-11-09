import React, { useState } from 'react'
import './MainContent.css'

import Versions from '../Versions'
import TaskEditor from './TaskEditor/TaskEditor'

import type {
  TaskDraft,
  TaskList
} from '../TopBar/SideBarMenu/SideBarMenu.types'

interface MainContentProps {
  activeList: TaskList | null
  taskLists: TaskList[]

  onCreateTask: (listId: string, data: TaskDraft) => void
  onToggleTask: (listId: string, taskId: string) => void
  onDeleteTask: (listId: string, taskId: string) => void
}

function MainContent({
  activeList,
  taskLists,
  onCreateTask,
  onToggleTask,
  onDeleteTask
}: MainContentProps): React.JSX.Element {

  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false)

  // Удаление задачи с подтверждением
  const handleDeleteTask = (taskId: string): void => {
    const confirmed = window.confirm('Удалить эту задачу?')

    if (confirmed && activeList) {
      onDeleteTask(activeList.id, taskId)
    }
  }

  // Если список не выбран, показываем главный экран
  if (!activeList) {
    return <Versions />
  }

  return (
    <>
      <main
        className="main-content"
        style={{
          '--list-color': activeList.color
        } as React.CSSProperties}
      >

        {/* Заголовок списка */}
        <div className="main-content__header">
          <span className="main-content__color" />

          <h1>{activeList.name}</h1>
        </div>

        {/* Задачи */}
        <div className="main-content__tasks">

          {activeList.tasks.length === 0 ? (
            <p className="main-content__empty">
              В этом списке пока нет задач.
              Нажми на +, чтобы добавить первую.
            </p>
          ) : (
            activeList.tasks.map(task => (
              <div
                key={task.id}
                className="main-content__task-row"
              >
                <label
                  className={`main-content__task ${task.isCompleted
                    ? 'main-content__task--completed'
                    : ''
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => onToggleTask(activeList.id, task.id)}
                  />

                  <span>{task.title}</span>
                </label>

                {/* Дополнительная информация */}
                <div className="main-content__task-meta">
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span>
                      {task.subtasks.length} подзадач
                    </span>
                  )}

                  {task.attachment && (
                    <span title={task.attachment.name}>
                      Фото
                    </span>
                  )}

                  {task.dueDate && (
                    <span>
                      Срок: {task.dueDate}
                    </span>
                  )}
                </div>

                {/* Удаление задачи */}
                <button
                  type="button"
                  className="main-content__delete-task"
                  onClick={() => handleDeleteTask(task.id)}
                  aria-label={`Удалить задачу ${task.title}`}
                  title="Удалить задачу"
                >
                  ×
                </button>
              </div>
            ))
          )}

        </div>
      </main>

      {/* Большая кнопка добавления */}
      <button
        type="button"
        className="main-content__add-task-button"
        style={{
          borderColor: activeList.color,
          color: activeList.color
        }}
        onClick={() => setIsTaskEditorOpen(true)}
        aria-label="Создать задачу"
        title="Создать задачу"
      >
        +
      </button>

      {/* Полноэкранный редактор задачи */}
      {isTaskEditorOpen && (
        <TaskEditor
          taskLists={taskLists}
          defaultListId={activeList.id}
          onCancel={() => setIsTaskEditorOpen(false)}
          onSave={(listId, data) => {
            onCreateTask(listId, data)
            setIsTaskEditorOpen(false)
          }}
        />
      )}
    </>
  )
}

export default MainContent
