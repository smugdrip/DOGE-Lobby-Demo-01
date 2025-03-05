import { Button } from '@material-ui/core';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('jwt');
        navigate('/login');
    };

    return (
        <Button variant="contained" color="primary" onClick={handleLogout}>
            Logout
        </Button>
    );
};

export default Logout;