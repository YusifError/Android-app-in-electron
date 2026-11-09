import { randomUUID } from 'node:crypto'
import { app } from 'electron'

import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'

import {
  basename,
  isAbsolute,
  join,
  relative,
  resolve,
  sep
} from 'node:path'

import { getDatabase } from './db'

// =====================================
// ТИПЫ ДАННЫХ
// =====================================

// Входные данные фотографии
export interface TaskAttachmentInput {
  name: string
  dataUrl: string
}

// Данные задачи, включая вложенные подзадачи
export interface TaskInput {
  title: string
  note?: string
  isCompleted?: boolean
  attachment?: TaskAttachmentInput | null
  subtasks?: TaskInput[]
  dueDate?: string | null
  reminderAt?: string | null
}

// Фотография, которую возвращаем в React
export interface StoredTaskAttachment {
  name: string
  dataUrl: string
}

// Задача, которую возвращаем в React
export interface StoredTask {
  id: string
  title: string
  isCompleted: boolean
  note: string
  attachment: StoredTaskAttachment | null
  subtasks: StoredTask[]
  dueDate: string | null
  reminderAt: string | null
}

// Строка задачи из SQLite
interface TaskRow {
  id: string
  list_id: string
  parent_task_id: string | null
  title: string
  note: string
  is_completed: number
  due_date: string | null
  reminder_at: string | null
}

// Строка фотографии из SQLite
interface AttachmentRow {
  task_id: string
  file_name: string
  file_path: string
  mime_type: string
}

// =====================================
// НАСТРОЙКИ ФОТОГРАФИЙ
// =====================================

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
}

// Папка для фотографий
function getAttachmentDirectory(): string {
  return join(app.getPath('userData'), 'attachments')
}

// Проверяем, что путь находится внутри папки вложений
function isManagedAttachmentPath(filePath: string): boolean {
  const directory = resolve(getAttachmentDirectory())
  const target = resolve(filePath)
  const relativePath = relative(directory, target)

  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  )
}

// =====================================
// УДАЛЕНИЕ ФОТОГРАФИЙ
// =====================================

// Удаление физических файлов фотографий
export function removeStoredAttachmentFiles(paths: string[]): void {
  for (const filePath of paths) {
    if (!isManagedAttachmentPath(filePath)) {
      continue
    }

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    } catch (error) {
      console.error('Failed to remove attachment:', error)
    }
  }
}

// =====================================
// СОХРАНЕНИЕ ФОТОГРАФИЙ
// =====================================

// Сохранение фотографии на диск
function saveAttachment(
  attachment: TaskAttachmentInput
): {
  name: string
  path: string
  mimeType: string
} {
  const match = attachment.dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/
  )

  if (!match) {
    throw new Error('Unsupported image format')
  }

  const mimeType = match[1]
  const base64Data = match[2]

  const buffer = Buffer.from(base64Data, 'base64')

  // Проверяем размер фотографии
  if (
    buffer.length === 0 ||
    buffer.length > MAX_ATTACHMENT_SIZE
  ) {
    throw new Error('Invalid image size')
  }

  // Проверяем корректность Base64
  if (buffer.toString('base64') !== base64Data) {
    throw new Error('Invalid image data')
  }

  const extension = MIME_EXTENSIONS[mimeType]

  const directory = getAttachmentDirectory()

  mkdirSync(directory, { recursive: true })

  const filePath = join(
    directory,
    `${randomUUID()}.${extension}`
  )

  writeFileSync(filePath, buffer, { flag: 'wx' })

  return {
    name: basename(attachment.name).slice(0, 255) || `image.${extension}`,
    path: filePath,
    mimeType
  }
}

// Чтение фотографии с диска
function readStoredAttachment(
  row: AttachmentRow
): StoredTaskAttachment | null {
  if (!isManagedAttachmentPath(row.file_path)) {
    return null
  }

  try {
    if (!existsSync(row.file_path)) {
      return null
    }

    const buffer = readFileSync(row.file_path)

    return {
      name: row.file_name,
      dataUrl: `data:${row.mime_type};base64,${buffer.toString('base64')}`
    }
  } catch (error) {
    console.error('Failed to read attachment:', error)
    return null
  }
}

// =====================================
// ПОЛУЧЕНИЕ ЗАДАЧ
// =====================================

// Получение всех задач выбранных списков
export function getTasksForLists(
  listIds: string[]
): Record<string, StoredTask[]> {
  const result: Record<string, StoredTask[]> = {}

  for (const listId of listIds) {
    result[listId] = []
  }

  if (listIds.length === 0) {
    return result
  }

  const db = getDatabase()

  const placeholders = listIds.map(() => '?').join(', ')

  // Получаем все задачи
  const rows = db.prepare(`
    SELECT
      id,
      list_id,
      parent_task_id,
      title,
      note,
      is_completed,
      due_date,
      reminder_at
    FROM tasks
    WHERE list_id IN (${placeholders})
    ORDER BY position ASC, created_at ASC, id ASC
  `).all(...listIds) as TaskRow[]

  // Получаем фотографии
  const attachmentRows = db.prepare(`
    SELECT
      attachments.task_id,
      attachments.file_name,
      attachments.file_path,
      attachments.mime_type
    FROM attachments
    INNER JOIN tasks
      ON tasks.id = attachments.task_id
    WHERE tasks.list_id IN (${placeholders})
    ORDER BY attachments.created_at ASC
  `).all(...listIds) as AttachmentRow[]

  const attachments = new Map<string, StoredTaskAttachment | null>()

  for (const row of attachmentRows) {
    attachments.set(row.task_id, readStoredAttachment(row))
  }

  const taskMap = new Map<string, StoredTask>()

  // Сначала создаём объекты всех задач
  for (const row of rows) {
    taskMap.set(row.id, {
      id: row.id,
      title: row.title,
      isCompleted: row.is_completed === 1,
      note: row.note,
      attachment: attachments.get(row.id) ?? null,
      subtasks: [],
      dueDate: row.due_date,
      reminderAt: row.reminder_at
    })
  }

  // Затем связываем задачи с их родителями
  for (const row of rows) {
    const task = taskMap.get(row.id)

    if (!task) {
      continue
    }

    if (row.parent_task_id) {
      const parent = taskMap.get(row.parent_task_id)

      if (parent) {
        parent.subtasks.push(task)
      }
    } else {
      result[row.list_id]?.push(task)
    }
  }

  return result
}

// =====================================
// ПОЛУЧЕНИЕ ПУТЕЙ ФОТОГРАФИЙ
// =====================================

// Вспомогательная функция для получения путей фотографий списка
export function getAttachmentPathsForList(listId: string): string[] {
  const db = getDatabase()

  const rows = db.prepare(`
    SELECT attachments.file_path
    FROM attachments
    INNER JOIN tasks
      ON tasks.id = attachments.task_id
    WHERE tasks.list_id = ?
  `).all(listId) as { file_path: string }[]

  return rows.map(row => row.file_path)
}

// =====================================
// СОЗДАНИЕ ЗАДАЧИ
// =====================================

// Создание задачи вместе с подзадачами
export function createTask(
  listId: string,
  input: TaskInput
): StoredTask {
  const db = getDatabase()

  // Проверяем существование списка
  const listExists = db.prepare(`
    SELECT id FROM task_lists WHERE id = ?
  `).get(listId)

  if (!listExists) {
    throw new Error('Task list not found')
  }

  const savedFilePaths: string[] = []

  try {
    const createTransaction = db.transaction(() => {
      const insertTask = db.prepare(`
        INSERT INTO tasks (
          id,
          list_id,
          parent_task_id,
          title,
          note,
          is_completed,
          due_date,
          reminder_at,
          position
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const insertAttachment = db.prepare(`
        INSERT INTO attachments (
          id,
          task_id,
          file_name,
          file_path,
          mime_type
        )
        VALUES (?, ?, ?, ?, ?)
      `)

      // Рекурсивное создание задачи
      const insertNode = (
        node: TaskInput,
        parentTaskId: string | null,
        position: number
      ): string => {
        const id = randomUUID()
        const title = node.title.trim()

        if (!title) {
          throw new Error('Task title cannot be empty')
        }

        insertTask.run(
          id,
          listId,
          parentTaskId,
          title,
          node.note ?? '',
          node.isCompleted ? 1 : 0,
          node.dueDate || null,
          node.reminderAt || null,
          position
        )

        // Если есть фотография, сохраняем её отдельно
        if (node.attachment) {
          const saved = saveAttachment(node.attachment)

          savedFilePaths.push(saved.path)

          insertAttachment.run(
            randomUUID(),
            id,
            saved.name,
            saved.path,
            saved.mimeType
          )
        }

        // Рекурсивно сохраняем подзадачи
        const subtasks = node.subtasks ?? []

        subtasks.forEach((subtask, index) => {
          insertNode(subtask, id, index)
        })

        return id
      }

      // Определяем позицию новой задачи
      const nextPosition = db.prepare(`
        SELECT COALESCE(MAX(position), -1) + 1 AS position
        FROM tasks
        WHERE list_id = ? AND parent_task_id IS NULL
      `).get(listId) as { position: number }

      return insertNode(input, null, nextPosition.position)
    })

    const taskId = createTransaction()

    // Получаем созданную задачу
    const tasks = getTasksForLists([listId])[listId] ?? []

    const createdTask = tasks.find(task => task.id === taskId)

    if (!createdTask) {
      throw new Error('Created task could not be loaded')
    }

    return createdTask

  } catch (error) {
    // Если операция не удалась, удаляем сохранённые файлы
    removeStoredAttachmentFiles(savedFilePaths)

    throw error
  }
}

// =====================================
// РЕДАКТИРОВАНИЕ ЗАДАЧИ
// =====================================

export function updateTask(
  listId: string,
  taskId: string,
  input: TaskInput
): StoredTask | null {
  const db = getDatabase()

  // Проверяем существование задачи
  const existingTask = db.prepare(`
    SELECT
      id,
      parent_task_id,
      is_completed,
      position
    FROM tasks
    WHERE id = ? AND list_id = ?
  `).get(taskId, listId) as {
    id: string
    parent_task_id: string | null
    is_completed: number
    position: number
  } | undefined

  if (!existingTask) {
    return null
  }

  // Получаем пути фотографий старой задачи и всех подзадач
  const oldAttachmentRows = db.prepare(`
    WITH RECURSIVE task_tree(id) AS (
      SELECT id
      FROM tasks
      WHERE id = ? AND list_id = ?

      UNION ALL

      SELECT child.id
      FROM tasks AS child
      INNER JOIN task_tree AS parent
        ON child.parent_task_id = parent.id
    )
    SELECT attachments.file_path
    FROM attachments
    INNER JOIN task_tree
      ON task_tree.id = attachments.task_id
  `).all(taskId, listId) as { file_path: string }[]

  const oldFilePaths = oldAttachmentRows.map(row => row.file_path)
  const newFilePaths: string[] = []

  try {
    // Транзакция редактирования
    const updateTransaction = db.transaction(() => {
      // Обновляем основную задачу
      db.prepare(`
        UPDATE tasks
        SET
          title = ?,
          note = ?,
          is_completed = ?,
          due_date = ?,
          reminder_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND list_id = ?
      `).run(
        input.title.trim(),
        input.note ?? '',
        input.isCompleted === undefined
          ? existingTask.is_completed
          : input.isCompleted ? 1 : 0,
        input.dueDate || null,
        input.reminderAt || null,
        taskId,
        listId
      )

      // Удаляем старое вложение основной задачи
      db.prepare(`
        DELETE FROM attachments
        WHERE task_id = ?
      `).run(taskId)

      // Удаляем старые подзадачи.
      // Вложенные уровни удалятся каскадно.
      db.prepare(`
        DELETE FROM tasks
        WHERE parent_task_id = ? AND list_id = ?
      `).run(taskId, listId)

      const insertAttachment = db.prepare(`
        INSERT INTO attachments (
          id,
          task_id,
          file_name,
          file_path,
          mime_type
        )
        VALUES (?, ?, ?, ?, ?)
      `)

      // Сохраняем новое фото основной задачи
      if (input.attachment) {
        const saved = saveAttachment(input.attachment)

        newFilePaths.push(saved.path)

        insertAttachment.run(
          randomUUID(),
          taskId,
          saved.name,
          saved.path,
          saved.mimeType
        )
      }

      const insertTask = db.prepare(`
        INSERT INTO tasks (
          id,
          list_id,
          parent_task_id,
          title,
          note,
          is_completed,
          due_date,
          reminder_at,
          position
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      // Рекурсивное создание подзадач
      const insertNode = (
        node: TaskInput,
        parentTaskId: string,
        position: number
      ): void => {
        const id = randomUUID()
        const title = node.title.trim()

        if (!title) {
          throw new Error('Task title cannot be empty')
        }

        insertTask.run(
          id,
          listId,
          parentTaskId,
          title,
          node.note ?? '',
          node.isCompleted ? 1 : 0,
          node.dueDate || null,
          node.reminderAt || null,
          position
        )

        // Сохраняем фотографию подзадачи
        if (node.attachment) {
          const saved = saveAttachment(node.attachment)

          newFilePaths.push(saved.path)

          insertAttachment.run(
            randomUUID(),
            id,
            saved.name,
            saved.path,
            saved.mimeType
          )
        }

        // Создаём вложенные подзадачи
        const subtasks = node.subtasks ?? []

        subtasks.forEach((subtask, index) => {
          insertNode(subtask, id, index)
        })
      }

      const subtasks = input.subtasks ?? []

      subtasks.forEach((subtask, index) => {
        insertNode(subtask, taskId, index)
      })
    })

    // Выполняем транзакцию
    updateTransaction()

  } catch (error) {
    // При ошибке удаляем новые фотографии.
    // Старые записи SQLite и файлы остаются нетронутыми.
    removeStoredAttachmentFiles(newFilePaths)

    throw error
  }

  // Получаем обновлённое дерево задач
  const tasks = getTasksForLists([listId])[listId] ?? []

  // Ищем задачу, в том числе среди подзадач
  const findTask = (items: StoredTask[]): StoredTask | null => {
    for (const task of items) {
      if (task.id === taskId) {
        return task
      }

      const nestedTask = findTask(task.subtasks)

      if (nestedTask) {
        return nestedTask
      }
    }

    return null
  }

  const updatedTask = findTask(tasks)

  if (!updatedTask) {
    throw new Error('Updated task could not be loaded')
  }

  // Удаляем старые фотографии только после успешного обновления
  removeStoredAttachmentFiles(oldFilePaths)

  return updatedTask
}

// =====================================
// ИЗМЕНЕНИЕ СТАТУСА ЗАДАЧИ
// =====================================

// Изменение статуса выполнения задачи
export function setTaskCompleted(
  listId: string,
  taskId: string,
  isCompleted: boolean
): boolean {
  const db = getDatabase()

  const result = db.prepare(`
    UPDATE tasks
    SET
      is_completed = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND list_id = ?
  `).run(
    isCompleted ? 1 : 0,
    taskId,
    listId
  )

  return result.changes > 0
}

// =====================================
// УДАЛЕНИЕ ЗАДАЧИ
// =====================================

// Удаление задачи и всех её подзадач
export function deleteTask(
  listId: string,
  taskId: string
): boolean {
  const db = getDatabase()

  // Получаем фотографии задачи и всех её подзадач
  const attachmentRows = db.prepare(`
    WITH RECURSIVE task_tree(id) AS (
      SELECT id
      FROM tasks
      WHERE id = ? AND list_id = ?

      UNION ALL

      SELECT child.id
      FROM tasks AS child
      INNER JOIN task_tree AS parent
        ON child.parent_task_id = parent.id
    )
    SELECT attachments.file_path
    FROM attachments
    INNER JOIN task_tree
      ON task_tree.id = attachments.task_id
  `).all(taskId, listId) as { file_path: string }[]

  // Удаляем задачу из SQLite
  const result = db.prepare(`
    DELETE FROM tasks
    WHERE id = ? AND list_id = ?
  `).run(taskId, listId)

  // Если задача удалена, удаляем её фотографии
  if (result.changes > 0) {
    removeStoredAttachmentFiles(
      attachmentRows.map(row => row.file_path)
    )
  }

  return result.changes > 0
}