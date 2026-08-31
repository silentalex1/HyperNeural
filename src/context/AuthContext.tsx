import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type User = { username: string; email: string }

type StoredUser = User & { password: string }

type AuthValue = {
  user: User | null
  register: (username: string, email: string, password: string) => { ok: boolean; error?: string }
  login: (username: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  requestCode: (email: string) => string
}

const AuthContext = createContext<AuthValue>({
  user: null,
  register: () => ({ ok: false }),
  login: () => ({ ok: false }),
  logout: () => {},
  requestCode: () => '',
})

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem('inferforge-users')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem('inferforge-users', JSON.stringify(users))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('inferforge-user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem('inferforge-user', JSON.stringify(user))
    else localStorage.removeItem('inferforge-user')
  }, [user])

  const requestCode = (email: string) => {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expires = Date.now() + 5 * 60 * 1000
    localStorage.setItem('inferforge-pending-code', JSON.stringify({ email: email.toLowerCase(), code, expires }))
    return code
  }

  const register = (username: string, email: string, password: string) => {
    const users = loadUsers()
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return { ok: false, error: 'Username already taken.' }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, error: 'Email already registered.' }
    const next: StoredUser = { username, email: email.toLowerCase(), password }
    users.push(next)
    saveUsers(users)
    setUser({ username, email: email.toLowerCase() })
    return { ok: true }
  }

  const login = (username: string, password: string) => {
    const users = loadUsers()
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password)
    if (!found) return { ok: false, error: 'Invalid username or password.' }
    setUser({ username: found.username, email: found.email })
    return { ok: true }
  }

  const logout = () => setUser(null)

  return <AuthContext.Provider value={{ user, register, login, logout, requestCode }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
