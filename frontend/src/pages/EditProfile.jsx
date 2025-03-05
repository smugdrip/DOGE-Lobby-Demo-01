import { useState } from "react";
import "../components/layout/EditProfile.css";
import Layout from "../components/layout/Layout"

export default function EditProfile() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        username: "",
        phone: "",
        address: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle the form submission here, such as making an API call to update the user profile
        console.log("Form submitted with: ", formData);
    };

    return (
        <Layout>
            <div className="edit-profile-container">
                <h2>Edit Profile</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="New email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="New password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="New username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone number:</label>
                        <input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="New phone number"
                        />

                    </div><div className="form-group">
                        <label htmlFor="address">Address:</label>
                        <input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="New address"
                        />
                    </div>

                    <button type="submit">Save Changes</button>
                </form>
            </div>
        </Layout>
    );
}
