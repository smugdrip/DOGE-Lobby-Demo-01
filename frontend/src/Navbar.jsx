import { Link, NavLink } from "react-router-dom";
import "./Navbar.css"

export default function Navbar() {
    return (
        <nav className="nav">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-icon active" : "nav-icon"}>
                <svg width="57" height="44" viewBox="0 0 57 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path id="c1508f24" d="M11.5 19.5V43.5H23.5V34H33.5V43.5H45.5V19.5L52.5 24H55L56.5 23L57 21.5L56.5 19.5L45.5 11.5V3L42 2.5L39 3V7L30.5 0.5L29.5 0H28.5H28L27 0.5L0.5 19.5L0 21.5L1 23.5L2.5 24.5L4.5 24L11.5 19.5Z" fill="white"></path>
                </svg>
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => isActive ? "nav-icon active" : "nav-icon"}>
                <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="03748b11">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 31C24.0604 31 31 24.0604 31 15.5C31 6.93959 24.0604 0 15.5 0C6.93959 0 0 6.93959 0 15.5C0 24.0604 6.93959 31 15.5 31ZM15.5 25C20.7467 25 25 20.7467 25 15.5C25 10.2533 20.7467 6 15.5 6C10.2533 6 6 10.2533 6 15.5C6 20.7467 10.2533 25 15.5 25Z" fill="white"></path>
                        <path d="M32.5 27.5C34.1603 26.9965 44.5188 38.7193 44.6412 39.1859C44.7636 39.6525 44.846 40.1589 44.6137 41.0358L40.9298 44.7198C40.1412 45.0094 39.6961 45.1271 38.8554 44.7506C38.8554 44.7506 27.2096 34.5 27.1048 33C27.0001 31.5 30.8398 28.0035 32.5 27.5Z" fill="white"></path>
                        <path d="M24 27.5355L27.5355 24L31.5547 28.0192L28.0192 31.5547L24 27.5355Z" fill="white"></path>
                    </g>
                </svg>
            </NavLink>
            <NavLink to="/notifications" className={({ isActive }) => isActive ? "nav-icon active" : "nav-icon"}>
                <svg width="41" height="45" viewBox="0 0 41 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="fdc8c45a">
                        <path d="M1.27895 37.4016C1.27895 35.6067 2.73403 34.1516 4.52895 34.1516H36.029C37.8239 34.1516 39.279 35.6067 39.279 37.4016C39.279 39.1966 37.8239 40.6516 36.029 40.6516H4.52895C2.73403 40.6516 1.27895 39.1966 1.27895 37.4016Z" fill="white"></path>
                        <path d="M23.279 39.6516C23.8312 39.6516 24.2883 40.103 24.189 40.6463C24.0145 41.6018 23.5907 42.4875 22.9609 43.1872C22.117 44.1249 20.9724 44.6516 19.779 44.6516C18.5855 44.6516 17.4409 44.1249 16.597 43.1872C15.9672 42.4875 15.5434 41.6018 15.3689 40.6463C15.2696 40.103 15.7267 39.6516 16.279 39.6516H23.279Z" fill="white"></path>
                        <path d="M1.27895 36.6516L1.77895 35.6516L2.27895 35.1516L4.77895 37.6516V40.6516H0.500453C0.15135 40.6516 -0.0902905 40.303 0.0322878 39.9761L1.27895 36.6516Z" fill="white"></path>
                        <path d="M39.279 36.6516L38.779 35.6516L38.279 35.1516L35.779 37.6516V40.6516H40.0575C40.4066 40.6516 40.6482 40.303 40.5256 39.9761L39.279 36.6516Z" fill="white"></path>
                        <path d="M12.7789 8.15164H28.2789V33.1516H12.7789V8.15164Z" fill="white"></path>
                        <path d="M12.7789 10.1516L10.9789 11.1516L9.17893 12.6516L7.97893 14.1516L6.77893 16.1516L6.17893 17.6516L5.57893 19.6516L4.97893 26.1516L4.37893 29.1516L3.77893 30.6516V32.1516L4.97893 33.1516H12.7789V10.1516Z" fill="white"></path>
                        <path d="M28.2789 10.1516L29.2789 10.6516L29.7789 11.1516L31.3789 12.6516L32.5789 14.1516L33.7789 16.1516L34.3789 17.6516L34.9789 19.6516L35.5789 26.1516L36.1789 29.1516L36.7789 30.6516V32.1516L35.5789 33.1516H27.7789L28.2789 10.1516Z" fill="white"></path>
                        <path d="M28 7C28 5.14348 27.2098 3.36301 25.8033 2.05025C24.3968 0.737498 22.4891 1.40163e-07 20.5 0C18.5109 -1.40163e-07 16.6032 0.737498 15.1967 2.05025C13.7902 3.36301 13 5.14348 13 7L28 7Z" fill="white"></path>
                        <path d="M10 13H19V32H10V13Z" fill="white"></path>
                        <path d="M22 13H31V32H22V13Z" fill="white"></path>
                        <path d="M12 11H29V14H12V11Z" fill="white"></path>
                    </g>
                </svg>
            </NavLink>
            <NavLink to="profile" className={({ isActive }) => isActive ? "nav-icon active" : "nav-icon"}>
                <svg width="51" height="51" viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="7acdbfef">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M25.5 51C39.5833 51 51 39.5833 51 25.5C51 11.4167 39.5833 0 25.5 0C11.4167 0 0 11.4167 0 25.5C0 39.5833 11.4167 51 25.5 51ZM25.3229 47.8125C37.7436 47.8125 47.8125 37.7436 47.8125 25.3229C47.8125 12.9023 37.7436 2.83333 25.3229 2.83333C12.9023 2.83333 2.83333 12.9023 2.83333 25.3229C2.83333 37.7436 12.9023 47.8125 25.3229 47.8125Z" fill="white"></path>
                        <path d="M19.1817 38.6042V13.3167H34.607V16.4234H22.6135V23.829H31.8615V26.9358H22.6135V38.6042H19.1817Z" fill="white"></path>
                    </g>
                </svg>
            </NavLink>
            <div className="title-container">
                <Link to="/" className="freeflow-title">FreeFlow</Link>
            </div>
        </nav >
    );
}
