import { useState } from 'react'
import TopBar from './components/TopBar/TopBar'
import SideBarMenu from './components/TopBar/SideBarMenu/SideBarMenu'
import Versions from './components/Versions'

function App(): React.JSX.Element {

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  const toggleMenu = (): void => {
    setIsMenuOpen((prev) => !prev)
  }

  return (
    <>
      <TopBar onMenuClick={toggleMenu} />
      <SideBarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <Versions />
    </>
  )
}

export default App
