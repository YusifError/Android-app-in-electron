
import { randomUUID } from 'node:crypto'

import {
  getTasksForLists,
  getAttachmentPathsForList,
  removeStoredAttachmentFiles,
  type StoredTask
} from './tasks'

import { getDatabase } from './db'

export interface CreateTaskListInput {
  name: string
  color: string
}

export interface StoredTaskList {
  id: string
  name: string
  color: string
  tasks: StoredTask[]
}

interface TaskListRow {
  id: string
  name: string
  color: string
}

// Получение всех списков вместе с задачами
export function getTaskLists(): StoredTaskList[] {
  const db = getDatabase()

  const rows = db.prepare(`
    SELECT id, name, color
    FROM task_lists
    ORDER BY created_at ASC, id ASC
  `).all() as TaskListRow[]

  const tasksByList = getTasksForLists(
    rows.map(row => row.id)
  )

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    tasks: tasksByList[row.id] ?? []
  }))
}

// Создание списка
export function createTaskList(
  data: CreateTaskListInput
): StoredTaskList {
  const db = getDatabase()

  const name = data.name.trim()
  const color = data.color.trim().toUpperCase()

  if (!name) {
    throw new Error('List name cannot be empty')
  }

  if (!/^#[0-9A-F]{6}$/.test(color)) {
    throw new Error('Invalid HEX color')
  }

  const id = randomUUID()

  db.prepare(`
    INSERT INTO task_lists (id, name, color)
    VALUES (?, ?, ?)
  `).run(id, name, color)

  return {
    id,
    name,
    color,
    tasks: []
  }
}

// Удаление списка вместе с его задачами и фотографиями
export function deleteTaskList(id: string): boolean {
  const db = getDatabase()

  const attachmentPaths = getAttachmentPathsForList(id)

  const result = db.prepare(`
    DELETE FROM task_lists
    WHERE id = ?
  `).run(id)

  if (result.changes > 0) {
    removeStoredAttachmentFiles(attachmentPaths)
  }

  return result.changes > 0
}
