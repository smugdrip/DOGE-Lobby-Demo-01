import { useState } from 'react';
import Layout from '../components/layout/Layout';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap CSS is imported
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

const CreateAccount = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch('http://localhost:8000/api/users', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            navigate('/login');
        })
        .catch((error) => {
            console.error('Error:', error);
        });
        // console.log(formData);
    };

    return (
        <Layout>
            <h1 className="text-center my-4">Create Account</h1>
            <div className="d-flex justify-content-center align-items-center">
                <form onSubmit={handleSubmit} className="col-12 col-md-8 col-lg-6 p-4 bg-light rounded shadow">
                    <input type="text" className="form-control form-control-lg mb-3" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                    <input type="text" className="form-control form-control-lg mb-3" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
                    <input type="text" className="form-control form-control-lg mb-3" name="middleName" placeholder="Middle Name" value={formData.middleName} onChange={handleChange} />
                    <input type="text" className="form-control form-control-lg mb-3" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
                    <input type="email" className="form-control form-control-lg mb-3" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                    <input type="password" className="form-control form-control-lg mb-3" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                    <input type="text" className="form-control form-control-lg mb-3" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
                    <input type="text" className="form-control form-control-lg mb-3" name="addressLine1" placeholder="Address Line 1" value={formData.addressLine1} onChange={handleChange} required />
                    <input type="text" className="form-control form-control-lg mb-3" name="addressLine2" placeholder="Address Line 2" value={formData.addressLine2} onChange={handleChange} />
                    <input type="text" className="form-control form-control-lg mb-3" name="city" placeholder="City" value={formData.city} onChange={handleChange} required />
                    <input type="text" className="form-control form-control-lg mb-3" name="state" placeholder="State" value={formData.state} onChange={handleChange} required />
                    <input type="text" className="form-control form-control-lg mb-3" name="zipCode" placeholder="Zip Code" value={formData.zipCode} onChange={handleChange} required />
                    <input type="text" className="form-control form-control-lg mb-3" name="country" placeholder="Country" value={formData.country} onChange={handleChange} required />
                    <Button type="submit" className="btn btn-primary w-100">Create Account</Button>
                </form>
            </div>
        </Layout>
    );
};

export default CreateAccount;
