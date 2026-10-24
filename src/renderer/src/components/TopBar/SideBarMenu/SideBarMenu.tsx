// src/components/SideBarMenu/SideBarMenu.tsx
import React from 'react'
import './SideBarMenu.css'

interface SideBarMenuProps {
  isOpen: boolean
  onClose: () => void
}

function SideBarMenu({ isOpen, onClose }: SideBarMenuProps): React.JSX.Element {
  return (
    <>
      {/* Затемняющий фон. Появляется только когда меню открыто */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--open' : ''}`} 
        onClick={onClose} 
      />

      {/* Сам сайдбар */}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <h3>Навигация</h3>
          <button className="sidebar__close-btn" onClick={onClose}>×</button>
        </div>
        
        <nav className="sidebar__nav">
          <a href="#main" className="sidebar__link">Главная</a>
          <a href="#profile" className="sidebar__link">Профиль</a>
          <a href="#about" className="sidebar__link">О программе</a>
        </nav>
      </aside>
    </>
  )
}

export default SideBarMenu
