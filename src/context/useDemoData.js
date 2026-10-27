import { useContext } from 'react'
import DemoDataContext from './demoDataContext'

export function useDemoData() {
  const context = useContext(DemoDataContext)
  if (!context) {
    throw new Error('useDemoData harus digunakan di dalam DemoDataProvider')
  }
  return context
}
