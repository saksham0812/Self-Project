import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert("Registration Successful! 🎉 Please Login.");
      navigate('/login');
    } catch (err) {
      alert("Error: Email might already exist ❌");
    }
  };

  return (
    <div className="register-container">
      {/* 3D फ्लोटिंग कार्ड */}
      <div className="register-card-wrapper">
        
        <div className="register-form-container">
          <div className="register-header">
            <h2>Student Registration</h2>
            <p>Create your account to get started.</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Full Name Input with Icon */}
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input 
                type="text" 
                name="name" 
                placeholder="Full Name" 
                onChange={handleChange} 
                required 
                className="styled-input"
              />
            </div>

            {/* Email Input with Icon */}
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input 
                type="email" 
                name="email" 
                placeholder="Email Address" 
                onChange={handleChange} 
                required 
                className="styled-input"
              />
            </div>

            {/* Password Input with Icon */}
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input 
                type="password" 
                name="password" 
                placeholder="Password" 
                onChange={handleChange} 
                required 
                minlength="6"
                className="styled-input"
              />
            </div>

            <button type="submit" className="styled-button">Register Now</button>
          </form>
          
          <p style={{textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666'}}>
            Already have an account? <Link to="/login" style={{color: '#764ba2', fontWeight: 'bold', textDecoration: 'none'}}>Login here</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;