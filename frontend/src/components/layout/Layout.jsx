import Navbar from '../../pages/Navbar.jsx';
import PropTypes from 'prop-types';

const Layout = ({ children }) => {
    return (
        <div className="d-flex flex-column min-vh-100">
            <header className="d-flex justify-content-center">
                <Navbar />
            </header>
            <main className="flex-grow-1">
                {children}
            </main>
            <footer className="text-center mt-auto">
                <p className='mt-3'>&copy; 2025 FreeFlow Networks. All rights reserved.</p>
            </footer>
        </div>
    );
};
Layout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Layout;