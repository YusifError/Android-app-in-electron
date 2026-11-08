export interface Task {
  id: string
  title: string
  isCompleted: boolean
  subtasks?: Task[]
}

export interface TaskList {
  id: string
  name: string
  color: string
  tasks: Task[]
}