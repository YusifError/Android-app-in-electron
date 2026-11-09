
import React, { useState } from 'react'
import './TaskEditor.css'

import type {
  Task,
  TaskAttachment,
  TaskDraft,
  TaskList
} from '../../TopBar/SideBarMenu/SideBarMenu.types'

interface TaskEditorProps {
  taskLists: TaskList[]
  defaultListId: string
  onCancel: () => void
  onSave: (listId: string, data: TaskDraft) => void
}

function TaskEditor({
  taskLists,
  defaultListId,
  onCancel,
  onSave
}: TaskEditorProps): React.JSX.Element {

  // Название и заметка
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')

  // Фотография
  const [attachment, setAttachment] = useState<TaskAttachment | null>(null)
  const [attachmentError, setAttachmentError] = useState('')

  // Подзадачи
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [subtaskTitle, setSubtaskTitle] = useState('')

  // Выбранный список
  const [selectedListId, setSelectedListId] = useState(defaultListId)

  // Срок и напоминание
  const [dueDate, setDueDate] = useState('')
  const [reminderAt, setReminderAt] = useState('')

  // Прикрепление фотографии
  const handleAttachment = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAttachmentError('Можно прикрепить только изображение')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError('Размер фотографии не должен превышать 5 МБ')
      event.target.value = ''
      return
    }

    setAttachmentError('')

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachment({
          name: file.name,
          dataUrl: reader.result
        })
      }
    }

    reader.onerror = () => {
      setAttachmentError('Не удалось прочитать фотографию')
    }

    reader.readAsDataURL(file)

    event.target.value = ''
  }

  // Добавление подзадачи
  const handleAddSubtask = (): void => {
    const trimmedTitle = subtaskTitle.trim()

    if (!trimmedTitle) return

    const newSubtask: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      isCompleted: false,
      subtasks: []
    }

    setSubtasks(prev => [...prev, newSubtask])
    setSubtaskTitle('')
  }

  // Удаление подзадачи из формы
  const handleRemoveSubtask = (id: string): void => {
    setSubtasks(prev => prev.filter(task => task.id !== id))
  }

  // Создание задачи
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    const trimmedTitle = title.trim()

    if (!trimmedTitle || !selectedListId) return

    onSave(selectedListId, {
      title: trimmedTitle,
      note: note.trim(),
      attachment,
      subtasks,
      dueDate: dueDate || null,
      reminderAt: reminderAt || null
    })
  }

  return (
    <div className="task-editor-screen">

      <div className="task-editor">

        {/* Верхняя панель */}
        <div className="task-editor__header">
          <button
            type="button"
            className="task-editor__back"
            onClick={onCancel}
          >
            ← Назад
          </button>

          <h1>Новая задача</h1>

          <span />
        </div>

        <form onSubmit={handleSubmit}>

          {/* Название задачи */}
          <input
            className="task-editor__title"
            type="text"
            placeholder="Название задачи"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={150}
            autoFocus
            required
          />

          {/* Заметка */}
          <section className="task-editor__section">
            <h3>Заметка</h3>

            <textarea
              placeholder="Дополнительная информация..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
            />
          </section>

          {/* Фотография */}
          <section className="task-editor__section">
            <h3>Вложение</h3>

            <label
              htmlFor="task-attachment"
              className="task-editor__attachment-button"
            >
              ＋ Прикрепить фотографию
            </label>

            <input
              id="task-attachment"
              type="file"
              accept="image/*"
              hidden
              onChange={handleAttachment}
            />

            {attachmentError && (
              <p className="task-editor__error">
                {attachmentError}
              </p>
            )}

            {attachment && (
              <div className="task-editor__attachment-preview">
                <img
                  src={attachment.dataUrl}
                  alt="Прикреплённая фотография"
                />

                <div className="task-editor__attachment-info">
                  <span>{attachment.name}</span>

                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                  >
                    Удалить фотографию
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Подзадачи */}
          <section className="task-editor__section">
            <h3>Подзадачи</h3>

            <div className="task-editor__subtask-input">
              <input
                type="text"
                placeholder="Добавить подзадачу..."
                value={subtaskTitle}
                onChange={(event) => setSubtaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleAddSubtask()
                  }
                }}
              />

              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!subtaskTitle.trim()}
              >
                +
              </button>
            </div>

            <div className="task-editor__subtasks">
              {subtasks.map(subtask => (
                <div
                  key={subtask.id}
                  className="task-editor__subtask"
                >
                  <span>{subtask.title}</span>

                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    aria-label={`Удалить подзадачу ${subtask.title}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Выбор списка */}
          <section className="task-editor__section">
            <h3>Список</h3>

            <select
              value={selectedListId}
              onChange={(event) => setSelectedListId(event.target.value)}
            >
              {taskLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </section>

          {/* Срок */}
          <section className="task-editor__section">
            <h3>Срок</h3>

            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </section>

          {/* Напоминание */}
          <section className="task-editor__section">
            <h3>Напоминание</h3>

            <input
              type="datetime-local"
              value={reminderAt}
              onChange={(event) => setReminderAt(event.target.value)}
            />
          </section>

          {/* Действия */}
          <div className="task-editor__actions">
            <button
              type="button"
              className="task-editor__cancel"
              onClick={onCancel}
            >
              Отмена
            </button>

            <button
              type="submit"
              className="task-editor__submit"
              disabled={!title.trim()}
            >
              Создать задачу
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default TaskEditor
