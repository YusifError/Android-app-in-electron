import React from 'react' // 👈 Добавили импорт React для TypeScript
import './TopBar.css'

interface TopBarProps {
  onMenuClick: () => void
}

function TopBar({ onMenuClick }: TopBarProps): React.JSX.Element { // 🛠️ Исправлено: убрали лишнюю скобку )
  
  const handleMinimize = (): void => {
    window.electron.ipcRenderer.send('win:invoke', 'min')
  }

  const handleMaximize = (): void => {
    window.electron.ipcRenderer.send('win:invoke', 'max')
  }

  const handleClose = (): void => {
    window.electron.ipcRenderer.send('win:invoke', 'close')
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        {/* 🛠️ Исправлено: превратили span в интерактивную кнопку и повесили клик */}
        <button className="topbar__menu-btn" onClick={onMenuClick}>
          ☰ Меню
        </button>
      </div>

      <div className="topbar__right">
        <button className="topbar__button">Сообщить об ошибке</button>
        <button className="topbar__button">Настройки</button>
        
        {/* 🛠️ Исправлено: перенесли блок управления внутрь topbar__right, 
            чтобы кнопки встали в один ряд по горизонтали согласно CSS */}
        <div className="topbar__controls">
          <button className='control-btn min' onClick={handleMinimize}>—</button>
          <button className='control-btn max' onClick={handleMaximize}>▢</button>
          <button className='control-btn close' onClick={handleClose}>×</button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
