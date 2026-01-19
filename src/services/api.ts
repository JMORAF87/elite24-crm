export const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : ''

export const login = async (email: string, password: string) => {
  const response
