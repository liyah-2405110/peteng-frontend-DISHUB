import { useMemo } from 'react'
import DemoDataContext from './demoDataContext'

export function DemoDataProvider({ children }) {
  const value = useMemo(() => ({
    demoReports: [],
    demoNews: [],
    demoProfile: { name: '', phoneNumber: '' },
    storageError: '',
    updateDemoReport: () => false,
    saveDemoProfile: () => false,
  }), [])

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>
}
