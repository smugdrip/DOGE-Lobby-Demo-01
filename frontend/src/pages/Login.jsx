import Button from "../components/common/Button";
import { useState } from "react";
import Layout from "../components/layout/Layout";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const urlencoded = new URLSearchParams();
        urlencoded.append("username", formData.username);
        urlencoded.append("password", formData.password);

        fetch('http://localhost:8000/api/login', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: urlencoded.toString()
        })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                localStorage.setItem('jwt', data.access_token);
                navigate('/');
            } else {
                console.log('Login failed:', data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
        console.log('Form submitted:', formData);
    };

    return (
        <Layout>
            <div className="container d-flex justify-content-center align-items-center">
                <form onSubmit={handleSubmit} className="w-50">
                    <div className="text-center mt-3"><h2 className="mb-4">Log in to DOGE Lobby</h2></div>
                    <div className="form-group mb-3">
                        <label htmlFor="username" className="form-label">Username:</label>
                        <input
                            type="username"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label htmlFor="password" className="form-label">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-control"
                            required
                        />
                    </div>
                    <Button className="btn btn-primary w-100">Login</Button>
                    <div className="text-center mt-3">
                        <Link to="/create-account" className="btn btn-link mt-3">Don&apos;t have an account? Create one here</Link>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

export default Login;