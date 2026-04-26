import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"

const MainLayout = ({ children }) => {
  console.log("Layout Rendered")

  return (
    <div className="min-h-screen flex flex-col bg-[#050506] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/20 via-[#050506] to-[#030304]">

      <Navbar />

      <main className="flex-1 pt-16 md:pt-20 pb-0 mb-0 flex flex-col">
        {children || <Outlet />}
      </main>

    </div>
  )
}

export default MainLayout
