import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null)
  const [token, setToken] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem('devopsapp_token')
    const savedUser = localStorage.getItem('devopsapp_user')
    if (saved && savedUser) {
      setToken(saved)
      setUser(JSON.parse(savedUser))
    }
    setReady(true)
  }, [])

  const login = (tokenStr, userData) => {
    setToken(tokenStr)
    setUser(userData)
    localStorage.setItem('devopsapp_token', tokenStr)
    localStorage.setItem('devopsapp_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('devopsapp_token')
    localStorage.removeItem('devopsapp_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, ready, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)