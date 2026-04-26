import { createContext, useContext, useState } from 'react'

const VolunteerContext = createContext()

export const VolunteerProvider = ({ children }) => {
  const [myTasks, setMyTasks] = useState([])

  const addTask = (task) => {
    setMyTasks((prev) => [...prev, { ...task, status: 'Accepted' }])
  }

  const completeTask = (taskId) => {
    setMyTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: 'Completed', completedAt: 'just now' }
          : task
      )
    )
  }

  const removeTask = (taskId) => {
    setMyTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  return (
    <VolunteerContext.Provider value={{ myTasks, addTask, completeTask, removeTask }}>
      {children}
    </VolunteerContext.Provider>
  )
}

export const useVolunteer = () => {
  const context = useContext(VolunteerContext)
  if (!context) {
    throw new Error('useVolunteer must be used within VolunteerProvider')
  }
  return context
}