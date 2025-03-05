import Layout from '../components/layout/Layout'
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem('jwt') !== null;

    return (
        <Layout>
            <div>
                <div className="home-container text-center">
                    <h1>Let's find a great idea</h1>
                    {isLoggedIn ? (
                        <button className="btn btn-secondary" onClick={() => {
                            localStorage.removeItem('jwt');
                            navigate('/login');
                        }}>Logout</button>
                    ) : null}
                    <button className="btn btn-primary" onClick={() => navigate('/blockchain')}>
                        Go to Blockchain
                    </button>
                </div>
            </div>
        </Layout>
    );
}

export default Home;
