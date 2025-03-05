import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import Search from "./pages/Search.jsx"
import Login from "./pages/Login.jsx"
import Notifications from "./pages/Notifications.jsx"
import Profile from "./pages/Profile.jsx"
import EditProfile from "./pages/EditProfile.jsx"
import CreateAccount from "./pages/CreateAccount.jsx"
import Blockchain from "./pages/Blockchain/Blockchain.jsx"
// import CreateIdea from "./pages/CreateIdea.jsx"
import { ThemeProvider } from "styled-components"
import theme from "./styles/theme"
import "./styles/variables.css"

function App() {

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/blockchain" element={<Blockchain />} />
          {/* <Route path="/create-idea" element={<CreateIdea />} /> */}
        </Routes>
      </Router>
    </ThemeProvider>
  )

}

export default App
