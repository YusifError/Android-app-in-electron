
import './TopBar.css'

function TopBar(): React.JSX.Element {

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
        <span>Меню</span>
      </div>

      <div className="topbar__right">
        <button className="topbar__button">Сообщить об ошибке</button>
        <button className="topbar__button">Настройки</button>
      </div>

      <div className="topbar__controls">
        <button className='control-btn min' onClick={handleMinimize}>—</button>
        <button className='control-btn max' onClick={handleMaximize}>▢</button>
        <button className='control-btn close' onClick={handleClose}>×</button>
      </div>
    </header>
  )
}

export default TopBar
