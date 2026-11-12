import React, { useRef, useState } from 'react'
import './MainContent.css'

import Versions from '../Versions'
import TaskEditor from './TaskEditor/TaskEditor'

import type {
  Task,
  TaskAttachment,
  TaskDraft,
  TaskList
} from '../TopBar/SideBarMenu/SideBarMenu.types'

interface MainContentProps {
  activeList: TaskList | null
  taskLists: TaskList[]

  onCreateTask: (listId: string, data: TaskDraft) => Promise<void>
  onUpdateTask: (listId: string, taskId: string, data: TaskDraft) => Promise<void>
  onToggleTask: (listId: string, taskId: string) => void
  onDeleteTask: (listId: string, taskId: string) => void
}

function matchesSearch(task: Task, query: string): boolean {
  return [task.title, task.note ?? '', task.attachment?.name ?? '']
    .some(value => value.toLocaleLowerCase('ru-RU').includes(query))
    || (task.subtasks ?? []).some(subtask => matchesSearch(subtask, query))
}

function formatDate(value: string): string {
  const [date, time] = value.split('T')
  return date.split('-').reverse().join('.') + (time ? ' ' + time : '')
}

function MainContent({
  activeList,
  taskLists,
  onCreateTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask
}: MainContentProps): React.JSX.Element {

  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [photo, setPhoto] = useState<TaskAttachment | null>(null)
  const photoDialog = useRef<HTMLDialogElement>(null)

  const openPhoto = (attachment: TaskAttachment): void => {
    setPhoto(attachment)
    photoDialog.current?.showModal()
  }

  // Показываем детали рекурсивно, чтобы не потерять вложенные уровни.
  const renderDetails = (task: Task): React.JSX.Element => (
    <div className="main-content__details-body">
      {task.note && <p className="main-content__note">{task.note}</p>}
      {task.attachment && (
        <button
          type="button"
          className="main-content__photo"
          onClick={() => openPhoto(task.attachment!)}
          aria-label={`Открыть фотографию ${task.attachment.name}`}
        >
          <img src={task.attachment.dataUrl} alt={task.attachment.name} loading="lazy" />
          <span>{task.attachment.name} · Увеличить</span>
        </button>
      )}
      {(task.dueDate || task.reminderAt) && (
        <div className="main-content__dates">
          {task.dueDate && <span>Срок: <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time></span>}
          {task.reminderAt && <span>Напоминание: <time dateTime={task.reminderAt}>{formatDate(task.reminderAt)}</time></span>}
        </div>
      )}
      {!!task.subtasks?.length && (
        <ul className="main-content__subtasks" aria-label="Подзадачи">
          {task.subtasks.map(subtask => (
            <li key={subtask.id}>
              <div className={`main-content__subtask-title ${subtask.isCompleted ? 'main-content__subtask-title--completed' : ''}`}>
                <span aria-label={subtask.isCompleted ? 'Выполнена' : 'Не выполнена'}>{subtask.isCompleted ? '✓' : '○'}</span>
                <span>{subtask.title}</span>
              </div>
              {renderDetails(subtask)}
            </li>
          ))}
        </ul>
      )}
      {!task.note && !task.attachment && !task.dueDate && !task.reminderAt && !task.subtasks?.length && (
        <p className="main-content__details-empty">Дополнительных сведений нет.</p>
      )}
    </div>
  )

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

  const query = search.trim().toLocaleLowerCase('ru-RU')
  const visibleTasks = activeList.tasks.filter(task => matchesSearch(task, query))
  const completedCount = activeList.tasks.filter(task => task.isCompleted).length

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

        <div className="main-content__toolbar">
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Поиск задач и подзадач…"
            aria-label="Поиск задач и подзадач"
          />
          <span role="status">Выполнено {completedCount} из {activeList.tasks.length}</span>
        </div>

        {/* Задачи */}
        <div className="main-content__tasks">

          {activeList.tasks.length === 0 ? (
            <p className="main-content__empty">
              В этом списке пока нет задач.
              Нажми на +, чтобы добавить первую.
            </p>
          ) : (
            visibleTasks.length === 0 ? (
              <p className="main-content__empty">Ничего не найдено. Попробуйте другой запрос.</p>
            ) : visibleTasks.map(task => (
              <div key={task.id} className="main-content__task-card">
              <div
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
                    aria-label={task.title}
                    onChange={() => onToggleTask(activeList.id, task.id)}
                  />
                  <svg
                    className="main-content__completion-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
                    {task.isCompleted && <path d="m8 12 3 3 5-6" />}
                  </svg>

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.preventDefault()
                      setEditingTask(task)
                      setIsTaskEditorOpen(true)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setEditingTask(task)
                        setIsTaskEditorOpen(true)
                      }
                    }}
                    aria-label={`Редактировать задачу ${task.title}`}
                  >
                    {task.title}
                  </span>
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
                      Срок: {formatDate(task.dueDate)}
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
              <details className="main-content__details" open={Boolean(query)}>
                <summary>Подробности</summary>
                {renderDetails(task)}
              </details>
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
        onClick={() => {
          setEditingTask(null)
          setIsTaskEditorOpen(true)
        }}
        aria-label="Создать задачу"
        title="Создать задачу"
      >
        <svg
          className="main-content__add-task-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M6 12H18M12 6V18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <dialog
        ref={photoDialog}
        className="main-content__photo-dialog"
        aria-label="Просмотр фотографии"
        onClose={() => setPhoto(null)}
        onClick={event => {
          if (event.target === event.currentTarget) photoDialog.current?.close()
        }}
      >
        <div className="main-content__photo-dialog-content">
          <button type="button" autoFocus onClick={() => photoDialog.current?.close()}>Закрыть</button>
          {photo && <><img src={photo.dataUrl} alt={photo.name} /><p>{photo.name}</p></>}
        </div>
      </dialog>

      {/* Полноэкранный редактор задачи */}
      {isTaskEditorOpen && (
        <TaskEditor
          taskLists={taskLists}
          defaultListId={activeList.id}
          task={editingTask}
          onCancel={() => setIsTaskEditorOpen(false)}
          onSave={async (listId, data) => {
            if (editingTask) {
              await onUpdateTask(activeList.id, editingTask.id, data)
            } else {
              await onCreateTask(listId, data)
            }
            setIsTaskEditorOpen(false)
          }}
        />
      )}
    </>
  )
}

export default MainContent
