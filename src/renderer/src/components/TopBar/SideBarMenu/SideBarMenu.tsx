
import React, { useState } from 'react'
import './SideBarMenu.css'

import CreateListModal, {
  type CreateListData
} from './CreateListModal/CreateListModal'

import type { TaskList } from './SideBarMenu.types'

interface SideBarMenuProps {
  isOpen: boolean
  onClose: () => void

  taskLists: TaskList[]
  activeListId: string | null

  onSelectList: (id: string) => void
  onCreateList: (data: CreateListData) => void
  onGoHome: () => void
  onDeleteList: (id: string) => void
}

function SideBarMenu({
  isOpen,
  onClose,
  taskLists,
  activeListId,
  onSelectList,
  onCreateList,
  onGoHome,
  onDeleteList
}: SideBarMenuProps): React.JSX.Element {

  const [isTasksOpen, setIsTasksOpen] = useState(false)
  const [isCreateListOpen, setIsCreateListOpen] = useState(false)

  // Удаление списка с подтверждением
  const handleDeleteList = (list: TaskList): void => {
    const confirmed = window.confirm(
      `Удалить список «${list.name}» и все его задачи?`
    )

    if (confirmed) {
      onDeleteList(list.id)
    }
  }

  return (
    <>
      {/* Затемняющий фон */}
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--open' : ''}`}
        onClick={onClose}
      />

      {/* Сам сайдбар */}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <h3>Навигация</h3>

          <button
            className="sidebar__close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <nav className="sidebar__nav">

          {/* Главная */}
          <button
            type="button"
            className="sidebar__link"
            onClick={onGoHome}
          >
            Главная
          </button>

          {/* Раздел задач */}
          <button
            type="button"
            className={`sidebar__task-toggle ${
              isTasksOpen ? 'sidebar__task-toggle--open' : ''
            }`}
            onClick={() => setIsTasksOpen(prev => !prev)}
            aria-expanded={isTasksOpen}
            aria-controls="sidebar-tasks-submenu"
          >
            <span>Задачи</span>

            <span
              className={`sidebar__chevron ${
                isTasksOpen ? 'sidebar__chevron--open' : ''
              }`}
            >
              ⌄
            </span>
          </button>

          {/* Подменю задач */}
          <div
            id="sidebar-tasks-submenu"
            className={`sidebar__submenu ${
              isTasksOpen ? 'sidebar__submenu--open' : ''
            }`}
            aria-hidden={!isTasksOpen}
          >

            {/* Созданные списки */}
            {taskLists.map(list => (
              <div
                key={list.id}
                className="sidebar__created-list-row"
              >
                {/* Кнопка открытия списка */}
                <button
                  type="button"
                  className={`sidebar__created-list ${
                    activeListId === list.id
                      ? 'sidebar__created-list--active'
                      : ''
                  }`}
                  onClick={() => onSelectList(list.id)}
                  aria-pressed={activeListId === list.id}
                >
                  <span
                    className="sidebar__list-color"
                    style={{ backgroundColor: list.color }}
                  />

                  <span className="sidebar__created-list-name">
                    {list.name}
                  </span>
                </button>

                {/* Кнопка удаления */}
                <button
                  type="button"
                  className="sidebar__delete-list"
                  onClick={() => handleDeleteList(list)}
                  title="Удалить список"
                  aria-label={`Удалить список ${list.name}`}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Новый список */}
            <button
              type="button"
              className="sidebar__submenu-link"
              onClick={() => setIsCreateListOpen(true)}
            >
              Новый список
            </button>

          </div>

          <a href="#profile" className="sidebar__link">
            Профиль
          </a>

          <a href="#about" className="sidebar__link">
            О программе
          </a>

        </nav>
      </aside>

      {/* Окно создания списка */}
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreate={onCreateList}
      />
    </>
  )
}

export default SideBarMenu
