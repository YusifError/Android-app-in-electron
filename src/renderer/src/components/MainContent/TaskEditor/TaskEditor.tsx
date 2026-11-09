
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
  onSave: (listId: string, data: TaskDraft) => Promise<void>
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

  // Состояние сохранения
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Закрытие редактора
  const handleCancel = (): void => {
    if (isSaving) return

    onCancel()
  }

  // Прикрепление фотографии
  const handleAttachment = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0]

    if (!file) return

    const allowedImageTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif'
    ]

    if (!allowedImageTypes.includes(file.type)) {
      setAttachmentError('Поддерживаются PNG, JPG, WEBP и GIF')
      event.target.value = ''
      return
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setAttachmentError('Размер фотографии не должен превышать 5 МБ')
      event.target.value = ''
      return
    }

    setAttachmentError('')
    setSaveError('')

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

  // Удаление прикреплённой фотографии
  const handleRemoveAttachment = (): void => {
    setAttachment(null)
    setAttachmentError('')
  }

  // Добавление подзадачи
  const handleAddSubtask = (): void => {
    const trimmedTitle = subtaskTitle.trim()

    if (!trimmedTitle || isSaving) return

    const newSubtask: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      isCompleted: false,
      subtasks: []
    }

    setSubtasks(prev => [...prev, newSubtask])
    setSubtaskTitle('')
  }

  // Удаление подзадачи
  const handleRemoveSubtask = (id: string): void => {
    setSubtasks(prev => prev.filter(task => task.id !== id))
  }

  // Создание основной задачи
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()

    const trimmedTitle = title.trim()

    if (!trimmedTitle || !selectedListId || isSaving) return

    setIsSaving(true)
    setSaveError('')

    try {
      await onSave(selectedListId, {
        title: trimmedTitle,
        note: note.trim(),
        attachment,
        subtasks,
        dueDate: dueDate || null,
        reminderAt: reminderAt || null
      })

    } catch (error) {
      console.error('Failed to save task:', error)

      setSaveError(
        'Не удалось сохранить задачу. Попробуй ещё раз.'
      )

    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="task-editor-screen">

      <div className="task-editor">

        {/* Верхняя панель */}
        <div className="task-editor__header">

          <button
            type="button"
            className="task-editor__back"
            onClick={handleCancel}
            disabled={isSaving}
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
            disabled={isSaving}
          />

          {/* Заметка */}
          <section className="task-editor__section">

            <h3>Заметка</h3>

            <textarea
              placeholder="Дополнительная информация..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              disabled={isSaving}
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
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={handleAttachment}
              disabled={isSaving}
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
                    onClick={handleRemoveAttachment}
                    disabled={isSaving}
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
                disabled={isSaving}
              />

              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!subtaskTitle.trim() || isSaving}
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
                    disabled={isSaving}
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
              disabled={isSaving}
            >

              {taskLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}

            </select>

          </section>

          {/* Срок выполнения */}
          <section className="task-editor__section">

            <h3>Срок</h3>

            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={isSaving}
            />

          </section>

          {/* Напоминание */}
          <section className="task-editor__section">

            <h3>Напоминание</h3>

            <input
              type="datetime-local"
              value={reminderAt}
              onChange={(event) => setReminderAt(event.target.value)}
              disabled={isSaving}
            />

          </section>

          {/* Ошибка сохранения */}
          {saveError && (
            <p className="task-editor__error">
              {saveError}
            </p>
          )}

          {/* Кнопки */}
          <div className="task-editor__actions">

            <button
              type="button"
              className="task-editor__cancel"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Отмена
            </button>

            <button
              type="submit"
              className="task-editor__submit"
              disabled={!title.trim() || isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Создать задачу'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

export default TaskEditor
