
export interface TaskAttachment {
  name: string
  dataUrl: string
}

export interface Task {
  id: string
  title: string
  isCompleted: boolean

  note?: string
  attachment?: TaskAttachment | null
  subtasks?: Task[]

  dueDate?: string | null
  reminderAt?: string | null
}

export interface TaskList {
  id: string
  name: string
  color: string
  tasks: Task[]
}

export interface TaskDraft {
  title: string
  note: string
  attachment: TaskAttachment | null
  subtasks: Task[]
  dueDate: string | null
  reminderAt: string | null
}
