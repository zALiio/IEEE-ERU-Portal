import { createContext, useContext, useState, useCallback } from 'react'

const WelcomeContext = createContext()

export const useWelcome = () => {
  const context = useContext(WelcomeContext)
  if (!context) {
    throw new Error('useWelcome must be used within WelcomeProvider')
  }
  return context
}

export const WelcomeProvider = ({ children }) => {
  const [active, setActive] = useState(false)
  const [name, setName] = useState('')
  const [logoRect, setLogoRect] = useState(null)

  const startWelcome = useCallback((name, rect = null) => {
    setName(name)
    setLogoRect(rect)
    setActive(true)
  }, [])

  const endWelcome = useCallback(() => {
    setActive(false)
    setName('')
    setLogoRect(null)
  }, [])

  return (
    <WelcomeContext.Provider value={{ active, name, logoRect, startWelcome, endWelcome }}>
      {children}
    </WelcomeContext.Provider>
  )
}