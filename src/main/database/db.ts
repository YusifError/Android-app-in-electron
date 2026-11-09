
import Database from 'better-sqlite3'
import { app } from 'electron'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Тип подключения к SQLite
type DatabaseConnection = InstanceType<typeof Database>

// Здесь будет храниться открытое подключение
let db: DatabaseConnection | null = null

// Инициализация базы данных
export function initializeDatabase(): DatabaseConnection {
  // Если база уже открыта, повторно не подключаемся
  if (db?.open) {
    return db
  }

  // Получаем папку пользовательских данных приложения
  const dataDirectory = join(
    app.getPath('userData'),
    'app-data'
  )

  // Создаём папку, если её ещё нет
  mkdirSync(dataDirectory, { recursive: true })

  // Путь к файлу базы данных
  const databasePath = join(dataDirectory, 'tasks.sqlite')

  // Открываем или создаём SQLite
  const connection = new Database(databasePath)

  try {
    // Включаем поддержку внешних ключей
    connection.pragma('foreign_keys = ON')

    // Включаем журналирование WAL
    connection.pragma('journal_mode = WAL')

    // Время ожидания освобождения базы при блокировке
    connection.pragma('busy_timeout = 5000')

    // Узнаём версию структуры базы данных
    const version = connection.pragma(
      'user_version',
      { simple: true }
    ) as number

    // Первая версия структуры базы
    if (version < 1) {
      const createTables = connection.transaction(() => {

        // Таблица списков
        connection.exec(`
          CREATE TABLE IF NOT EXISTS task_lists (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `)

        // Таблица задач и подзадач
        connection.exec(`
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY NOT NULL,

            list_id TEXT NOT NULL,
            parent_task_id TEXT,

            title TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',

            is_completed INTEGER NOT NULL DEFAULT 0
              CHECK (is_completed IN (0, 1)),

            due_date TEXT,
            reminder_at TEXT,

            position INTEGER NOT NULL DEFAULT 0,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (list_id)
              REFERENCES task_lists(id)
              ON DELETE CASCADE,

            FOREIGN KEY (parent_task_id)
              REFERENCES tasks(id)
              ON DELETE CASCADE
          );
        `)

        // Таблица фотографий и других вложений
        connection.exec(`
          CREATE TABLE IF NOT EXISTS attachments (
            id TEXT PRIMARY KEY NOT NULL,

            task_id TEXT NOT NULL,

            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            mime_type TEXT NOT NULL,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (task_id)
              REFERENCES tasks(id)
              ON DELETE CASCADE
          );
        `)

        // Индексы для более быстрого поиска
        connection.exec(`
          CREATE INDEX IF NOT EXISTS idx_tasks_list_id
          ON tasks(list_id);

          CREATE INDEX IF NOT EXISTS idx_tasks_parent_id
          ON tasks(parent_task_id);

          CREATE INDEX IF NOT EXISTS idx_attachments_task_id
          ON attachments(task_id);
        `)

        // Запоминаем версию структуры базы
        connection.pragma('user_version = 1')
      })

      // Выполняем создание таблиц одной транзакцией
      createTables()
    }

    // Сохраняем открытое подключение
    db = connection

    console.log('SQLite database initialized successfully!')
    console.log('Database location:', databasePath)

    return connection

  } catch (error) {
    connection.close()
    throw error
  }
}

// Получение существующего подключения
export function getDatabase(): DatabaseConnection {
  if (!db?.open) {
    throw new Error('Database has not been initialized')
  }

  return db
}

// Закрытие подключения
export function closeDatabase(): void {
  if (db?.open) {
    db.close()
    db = null

    console.log('SQLite database connection closed')
  }
}
