export default function Navbar() {
    return (
        <nav className="nav">
            <a href="/">
                <svg width="57" height="44" viewBox="0 0 57 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path id="c1508f24" d="M11.5 19.5V43.5H23.5V34H33.5V43.5H45.5V19.5L52.5 24H55L56.5 23L57 21.5L56.5 19.5L45.5 11.5V3L42 2.5L39 3V7L30.5 0.5L29.5 0H28.5H28L27 0.5L0.5 19.5L0 21.5L1 23.5L2.5 24.5L4.5 24L11.5 19.5Z" fill="white"></path>
                </svg>
            </a>
            <a href="/search">
                <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="03748b11">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 31C24.0604 31 31 24.0604 31 15.5C31 6.93959 24.0604 0 15.5 0C6.93959 0 0 6.93959 0 15.5C0 24.0604 6.93959 31 15.5 31ZM15.5 25C20.7467 25 25 20.7467 25 15.5C25 10.2533 20.7467 6 15.5 6C10.2533 6 6 10.2533 6 15.5C6 20.7467 10.2533 25 15.5 25Z" fill="white"></path>
                        <path d="M32.5 27.5C34.1603 26.9965 44.5188 38.7193 44.6412 39.1859C44.7636 39.6525 44.846 40.1589 44.6137 41.0358L40.9298 44.7198C40.1412 45.0094 39.6961 45.1271 38.8554 44.7506C38.8554 44.7506 27.2096 34.5 27.1048 33C27.0001 31.5 30.8398 28.0035 32.5 27.5Z" fill="white"></path>
                        <path d="M24 27.5355L27.5355 24L31.5547 28.0192L28.0192 31.5547L24 27.5355Z" fill="white"></path>
                    </g>
                </svg>
            </a>
            <div className="title-container">
                <a href="/" className="freeflow-title">FreeFlow</a>
            </div>
            <ul></ul>
        </nav>
    );
}
