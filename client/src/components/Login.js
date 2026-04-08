import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserGraduate, FaUserShield } from 'react-icons/fa'; 
import axios from 'axios'; // 🔥 IMPORT ADDED
import ContactModal from './ContactModal'; 
import './Login.css'; 

const Login = () => {
  const [role, setRole] = useState('student'); 
  const [showHelp, setShowHelp] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = formData.email.toLowerCase().trim();
    const cleanPass = formData.password.trim();

    if (!cleanEmail || !cleanPass) {
        return alert("Please enter Email & Password ❌");
    }

    try {
        if (role === 'admin') {
            // Static Admin Logic (Agar backend nahi hai admin ke liye)
            if(cleanEmail === 'admin@college.edu' && cleanPass === 'admin123') {
                localStorage.setItem('token', 'mock-admin-token'); // Fake token for Admin
                alert("Welcome Admin! 👨‍💼 Login Successful.");
                navigate('/admin'); 
            } else {
                alert("Invalid Admin Credentials ❌");
            }
        } else {
            // 🔥 REAL STUDENT LOGIN (Backend Call)
            // Yahan hum server se token maang rahe hain
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                email: cleanEmail,
                password: cleanPass
            });

            // 👇 SABSE ZAROORI LINE (Token Save karna)
            localStorage.setItem('token', res.data.token); 
            
            alert("Welcome Student! 🎓 Login Successful.");
            navigate('/dashboard'); 
        }
    } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || "Login Failed! Check credentials.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        
        {/* Left Side: Image */}
        <div className="login-left">
          <img 
            src="https://img.freepik.com/free-vector/college-students-concept-illustration_114360-10205.jpg?w=740" 
            alt="Login Illustration" 
            className="login-image"
          />
        </div>

        {/* Right Side: Form */}
        <div className="login-right">
          
          {/* Toggle Buttons */}
          <div style={{ display: 'flex', background: '#f1f2f6', borderRadius: '30px', padding: '5px', marginBottom: '30px' }}>
              <button 
                  type="button" onClick={() => setRole('student')}
                  style={{
                      flex: 1, padding: '10px', borderRadius: '25px', border: 'none',
                      background: role === 'student' ? '#6c5ce7' : 'transparent',
                      color: role === 'student' ? 'white' : '#636e72',
                      fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
              >
                  <FaUserGraduate /> Student
              </button>

              <button 
                  type="button" onClick={() => setRole('admin')}
                  style={{
                      flex: 1, padding: '10px', borderRadius: '25px', border: 'none',
                      background: role === 'admin' ? '#0984e3' : 'transparent',
                      color: role === 'admin' ? 'white' : '#636e72',
                      fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
              >
                  <FaUserShield /> Admin
              </button>
          </div>

          <div className="login-header">
            <h2 style={{color: role === 'admin' ? '#0984e3' : '#333', fontSize: '24px', marginBottom: '10px'}}>
                {role === 'admin' ? 'Admin Access 🔐' : 'Student Login 🎓'}
            </h2>
            <p style={{marginBottom: '20px'}}>Please enter your details.</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required className="styled-input" />
            </div>

            <div className="input-wrapper"> 
              <FaLock className="input-icon" />
              <input type="password" name="password" placeholder="Password" onChange={handleChange} required className="styled-input" />
            </div>

            {role === 'student' && (
                <div style={{ textAlign: 'right', marginTop: '5px', marginBottom: '15px' }}>
                    <span onClick={() => alert("Reset link sent!")} style={{ color: '#3498db', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                        Forgot Password?
                    </span>
                </div>
            )}
            
            {role === 'admin' && <div style={{ marginBottom: '25px' }}></div>}

            <button 
                type="submit" 
                className="styled-button"
                style={{ background: role === 'admin' ? '#0984e3' : '#6c5ce7', marginTop: '10px' }}
            >
                Login as {role === 'student' ? 'Student' : 'Admin'}
            </button>
          </form>
          
          {role === 'student' && (
              <>
                  <p style={{textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666'}}>
                    Don't have an account? <Link to="/register" style={{color: '#764ba2', fontWeight: 'bold', textDecoration: 'none'}}>Register here</Link>
                  </p>

                  <div style={{marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign:'center'}}>
                      <p style={{fontSize: '12px', color: '#999', marginBottom: '8px'}}>In trouble & can't login?</p>
                      <button type="button" onClick={() => setShowHelp(true)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)', fontSize:'13px' }}>
                          🆘 Emergency Help
                      </button>
                  </div>
              </>
          )}

        </div>
      </div>

      {showHelp && <ContactModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default Login;