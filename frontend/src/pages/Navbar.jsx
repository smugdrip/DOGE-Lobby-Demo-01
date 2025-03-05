import { NavLink } from "react-router-dom";
// import "../components/layout/Navbar.css"
import HomeIcon from "../components/icons/HomeIcon";
import SearchIcon from "../components/icons/SearchIcon";
import NotificationsIcon from "../components/icons/NotificationsIcon";

export default function Navbar() {
    const isLoggedIn = !!localStorage.getItem("jwt");

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark w-100 rounded-4 mx-3 my-3 px-2">
            <div className="container-fluid align-items-center">
                <div className="d-flex">
                    <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active me-3" : "nav-link me-3"}>
                        <HomeIcon />
                    </NavLink>
                    <NavLink to="/search" className={({ isActive }) => isActive ? "nav-link active me-3" : "nav-link me-3"}>
                        <SearchIcon />
                    </NavLink>
                </div>
                <div className="flex-grow-2">
                    <NavLink to="/" className="navbar-brand mx-auto" style={{ fontSize: "3rem", color: "#468B97" }}>FreeFlow</NavLink>
                </div>
                <div className="d-flex">
                    {isLoggedIn ? (
                        <div className="d-flex align-items-center">
                            <NavLink to="/notifications" className={({ isActive }) => isActive ? "nav-link active me-3" : "nav-link me-3"}>
                                <NotificationsIcon />
                            </NavLink>
                            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                <img src="/pillars_of_creation.webp" alt="Profile" className="rounded-circle" width="30" height="30" />
                            </NavLink>
                        </div>
                    ) : (
                        <div className="login-container">
                            <NavLink to="/login" className="btn btn-primary">Login</NavLink>
                        </div>
                    )}
                </div>
            </div>
        </nav >
    );
}
