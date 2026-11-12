import React from 'react' // 👈 Добавили импорт React для TypeScript
import './TopBar.css'
import menuIcon from '../../assets/icons/menu.svg'
import closeIcon from '../../assets/icons/close.svg'
import errorReportIcon from '../../assets/icons/error-report.svg'
import minimizeIcon from '../../assets/icons/minimize.svg'
import restoreIcon from '../../assets/icons/restore.svg'
import settingsIcon from '../../assets/icons/settings.svg'

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
        <button type="button" className="topbar__menu-btn" onClick={onMenuClick} aria-label="Меню" title="Меню">
          <img className="topbar__icon topbar__menu-icon" src={menuIcon} alt="" draggable={false} />
        </button>
      </div>

      <div className="topbar__right">
        <button type="button" className="topbar__button topbar__icon-button" aria-label="Сообщить об ошибке" title="Сообщить об ошибке">
          <img className="topbar__icon" src={errorReportIcon} alt="" draggable={false} />
        </button>
        <button type="button" className="topbar__button topbar__icon-button" aria-label="Настройки" title="Настройки">
          <img className="topbar__icon" src={settingsIcon} alt="" draggable={false} />
        </button>
        
        {/* 🛠️ Исправлено: перенесли блок управления внутрь topbar__right, 
            чтобы кнопки встали в один ряд по горизонтали согласно CSS */}
        <div className="topbar__controls">
          <button type="button" className="control-btn min" onClick={handleMinimize} aria-label="Свернуть" title="Свернуть">
            <img className="topbar__icon" src={minimizeIcon} alt="" draggable={false} />
          </button>
          <button type="button" className="control-btn max" onClick={handleMaximize} aria-label="Развернуть / Восстановить" title="Развернуть / Восстановить">
            <img className="topbar__icon" src={restoreIcon} alt="" draggable={false} />
          </button>
          <button type="button" className="control-btn close" onClick={handleClose} aria-label="Закрыть" title="Закрыть">
            <img className="topbar__icon" src={closeIcon} alt="" draggable={false} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
