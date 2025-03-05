import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { FaCog } from "react-icons/fa";
import Layout from '../components/layout/Layout'
import "../components/layout/Profile.css"

export default function Profile() {
    const [dropdownToggled, setDropdownToggled] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handler(e) {
            if (dropdownRef.current) {
                if (!dropdownRef.current.contains(e.target))
                    setDropdownToggled(false);
            }
        }

        document.addEventListener('mousedown', handler)
        return () => {
            document.removeEventListener('mousedown', handler)
        }
    });

    const dropDownOptions = [
        {
            id: 1,
            label: "Edit Profile",
            value: "edit-profile",
            link: "/edit-profile"

        },
        {
            id: 2,
            label: "Reset Password",
            value: "reset-password"
        },
        {
            id: 3,
            label: "Logout",
            value: "logout"
        },
    ];

    return (
        <Layout>
            <div className="profile-page">
                <div className="dropdown" ref={dropdownRef}>
                    <button
                        className="toggle"
                        onClick={() => {
                            setDropdownToggled(!dropdownToggled);
                        }}>
                        <FaCog size={30} className="gear-icon" />
                    </button>
                    <div className={`options ${dropdownToggled ? "visible" : ""}`}>
                        {dropDownOptions.map((option) => {
                            if (option.label === "Logout")
                                return <button key={option.id} className="logout"  onClick={() => {
                                    setDropdownToggled(false)
                                }
                                }>{option.label}</button>;
                            return (<Link
                                to={option.link || '#'}
                                key={option.id}
                                onClick={() => {
                                    setDropdownToggled(false)
                                }}><button>{option.label}</button>
                            </Link>);
                        })}
                    </div>
                </div>
            </div>
        </Layout>
    );
}