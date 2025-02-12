import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./Navbar.jsx"
import Search from "./search.jsx"
import './App.css'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return(
    <Router>
      <Navbar />
      <Routes>
        <Route path="/search" element={<Search />} />
      </Routes>
    </Router>
  )

}

export default App
