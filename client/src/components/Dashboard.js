import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  const [grievance, setGrievance] = useState({ 
    category: 'Academic', 
    message: '', 
    priority: 'Low', 
    isPrivate: false, 
    isAnonymous: false, 
    imageUrl: '' 
  });
  
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  
  // --- States for Feedback & Rating ---
  const [feedbackText, setFeedbackText] = useState({}); 
  const [ratings, setRatings] = useState({}); 
  const [editingId, setEditingId] = useState(null); // Added for Edit functionality

  const theme = {
    bg: darkMode ? '#121212' : '#f4f7f6',
    card: darkMode ? '#1e1e1e' : 'white',
    text: darkMode ? '#e0e0e0' : '#333',
    subText: darkMode ? '#b0b0b0' : '#555',
    inputBg: darkMode ? '#2d2d2d' : 'white',
    border: darkMode ? '#444' : '#ddd',
    shadow: darkMode ? '0 4px 8px rgba(0,0,0,0.5)' : '0 4px 8px rgba(0,0,0,0.1)',
    accent: darkMode ? '#ffcc00' : '#3498db'
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/login');
    else fetchHistory();
  }, [navigate]);

  // 🔥 Ragging Safety Logic
  useEffect(() => {
    if (grievance.category === 'Ragging/Bullying') {
      setGrievance(prev => ({ ...prev, priority: 'High', isPrivate: true, isAnonymous: true }));
    }
  }, [grievance.category]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/grievances');
      setHistory(res.data);
    } catch (error) { console.log("Error fetching data"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/grievances', grievance);
    alert("Complaint Submitted! 📨");
    window.location.reload();
  };

  const submitFeedback = async (id) => {
    const rate = ratings[id];
    const text = feedbackText[id] || "No comments provided";

    if(!rate) return alert("Please select a Star Rating ⭐");

    try {
        await axios.put(`http://localhost:5000/api/grievances/${id}/feedback`, { 
            feedback: text,
            rating: rate 
        });
        alert("Feedback Saved! ❤️");
        setEditingId(null); // Close edit mode after saving
        fetchHistory(); 
    } catch (error) { 
        alert("Feedback submission failed!"); 
    }
  };

 const handleSOS = (type) => {
    // Check agar browser GPS support karta hai
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Success: Location mil gayi
          const { latitude, longitude } = position.coords;
          const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          
          const sosData = { 
            category: 'EMERGENCY', 
            priority: 'High', 
            message: `🚨 SOS ALERT: ${type} Emergency reported!\n📍 Live Location: ${mapLink}`, 
            isPrivate: false 
          };

          try {
            await axios.post('http://localhost:5000/api/grievances', sosData);
            alert(`🚨 ${type} Alert Sent with GPS Location! 📍`);
            setShowSOS(false);
            fetchHistory();
          } catch (error) { 
            alert("SOS Failed to send!"); 
          }
        },
        async (error) => {
          // Error: Agar user ne Location mana kar di, tab bhi alert bhej do bina location ke
          alert("⚠️ Location access denied! Sending alert without GPS.");
          const sosData = { 
            category: 'EMERGENCY', 
            priority: 'High', 
            message: `🚨 SOS ALERT: ${type} Emergency reported! (Location not shared)`, 
            isPrivate: false 
          };
          try {
             await axios.post('http://localhost:5000/api/grievances', sosData);
             setShowSOS(false);
             fetchHistory();
          } catch(err) { alert("SOS Failed!"); }
        }
      );
    } else {
      // Agar browser purana hai
      alert("GPS not supported in this browser ❌");
    }
  };
  const handleUpvote = async (id) => {
    await axios.put(`http://localhost:5000/api/grievances/${id}/upvote`);
    fetchHistory();
  };

  const handleReopen = async (id, currentCategory) => {
    if(window.confirm("Issue not solved? Reopen?")) {
        try {
            const updateData = { status: 'Pending' };
            if (currentCategory === 'Ragging/Bullying') updateData.priority = 'High';
            await axios.put(`http://localhost:5000/api/grievances/${id}`, updateData);
            alert("Complaint Reopened! 🔄");
            fetchHistory();
        } catch (error) { alert("Error"); }
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Withdraw this complaint?")) {
        try {
            await axios.delete(`http://localhost:5000/api/grievances/${id}`);
            alert("Withdrawn Successfully! 🗑️");
            fetchHistory(); 
        } catch (error) { alert("Error"); }
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Browser not supported 🎤"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.onresult = (event) => {
      setGrievance(prev => ({ ...prev, message: prev.message + " " + event.results[0][0].transcript }));
    };
    recognition.start();
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const checkLanguage = (text) => {
    const badWords = ["stupid", "idiot", "useless", "nonsense"];
    return badWords.some(word => text.toLowerCase().includes(word));
  };
  const isAbusive = checkLanguage(grievance.message);

  const getSortedHistory = () => {
      let publicData = history.filter(item => !item.isPrivate); 
      if(searchTerm) {
          publicData = publicData.filter(val => 
             val.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
             val.message.toLowerCase().includes(searchTerm.toLowerCase())
          );
      }
      if(sortBy === 'Newest') publicData.sort((a,b) => new Date(b.date) - new Date(a.date));
      else if (sortBy === 'Oldest') publicData.sort((a,b) => new Date(a.date) - new Date(b.date));
      else if (sortBy === 'Most Upvoted') publicData.sort((a,b) => (b.upvotes || 0) - (a.upvotes || 0));
      else if (sortBy === 'High Priority') {
          const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
          publicData.sort((a,b) => priorityMap[b.priority] - priorityMap[a.priority]);
      }
      return publicData;
  };

  const renderProgressBar = (status) => {
    let progress = 10; let color = '#ff4d4d';
    if (status === 'In Progress') { progress = 50; color = '#3498db'; }
    if (status === 'Resolved') { progress = 100; color = '#2ecc71'; }
    return (
        <div style={{ margin: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.subText, marginBottom: '5px', fontWeight:'bold' }}>
                <span>📩 Sent</span><span>⚙️ Processing</span><span>✅ Done</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: darkMode ? '#444' : '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: color, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
        </div>
    );
  };

  const getIcon = (c) => {
     if(c==='Academic') return '📚'; if(c==='Sanitation') return '🧹';
     if(c==='Infrastructure') return '🏢'; if(c==='Canteen') return '🍔';
     if(c==='Ragging/Bullying') return '🚨'; if(c==='EMERGENCY') return '🆘'; return '📝';
  };

 // 👇 1. Helper Function (Isse component ke bahar ya upar rakhna)
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
};


// 👇 2. Main Download Function
// 👇 2. Main Download Function (Updated for Smart Name)
const downloadReceipt = async (item) => {
    let userInput = prompt("Receipt par print karne ke liye naam enter karein:", "Anonymous Student");
    let finalName = (userInput && userInput.trim() !== "") ? userInput : "Anonymous Student";
    
    const doc = new jsPDF();

    // --- A. COLORS & SETTINGS ---
    const primaryColor = [0, 51, 102];      
    const secondaryColor = [245, 245, 245]; 
    const resolvedColor = [46, 204, 113];   
    const pendingColor = [231, 76, 60];     
    
    // --- SMART NAME FINDER (Ye Naya Hai) ---
    // Ye dhoondega ki naam kahan chupa hai taaki "Student" na likhna pade
   
    // --- B. HEADER SECTION ---
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 45, 'F'); 

    // Logo Load 
    try {
        const imgElement = await loadImage('/logo.png'); 
        doc.addImage(imgElement, 'PNG', 14, 8, 28, 28); 
    } catch (err) {
        console.error("Logo fallback text mode.");
    }

    // University Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); 
    doc.setFont("helvetica", "bold");
    doc.text("SHARDA UNIVERSITY, Greater Noida", 50, 18); 
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Student Grievance Redressal Cell", 50, 26);
    
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 220); 
    doc.text("Official Acknowledgement Receipt", 50, 33);

    // --- C. DATA FORMATTING ---
    const shortId = item._id.substring(item._id.length - 6).toUpperCase();
    const formattedID = `SU-GRV-${shortId}`; 

    const filedDate = item.createdAt 
        ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString();

    // --- D. STATUS BADGE ---
    let statusColor = item.status === 'Resolved' ? resolvedColor : pendingColor;
    
    doc.setDrawColor(...statusColor);
    doc.setFillColor(...statusColor);
    doc.roundedRect(150, 55, 40, 10, 2, 2, 'FD'); 
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(item.status ? item.status.toUpperCase() : "PENDING", 170, 61.5, null, null, "center");

    // --- E. PROFESSIONAL TABLE ---
    autoTable(doc, {
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', halign: 'left' },
        bodyStyles: { textColor: 50, cellPadding: 4, fontSize: 10 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50, fillColor: secondaryColor }, 
            1: { cellWidth: 'auto' } 
        },
        body: [
            ['Reference No.', formattedID],
            ['Date Filed', filedDate],
            ['Category', item.category || 'General'],
            ['Priority Level', item.priority || 'Standard'],
            ['Student Name', finalName],  // ✅ Yahan ab sahi naam aayega
            ['Description', item.message || 'No details provided.']
        ],
    });

    // --- F. DIGITAL STAMP & FOOTER ---
    const finalY = doc.lastAutoTable.finalY + 30; 
    
    // Stamp Box
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]); 
    doc.setLineWidth(1);
    doc.rect(145, finalY - 25, 40, 15); 

    doc.setFontSize(8);
    doc.setTextColor(...primaryColor); 
    doc.setFont("helvetica", "bold");
    doc.text("DIGITALLY SIGNED", 165, finalY - 19, null, null, "center");
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Grievance Cell", 165, finalY - 14, null, null, "center");

    // Line & Authority
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(140, finalY, 190, finalY); 

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signatory", 165, finalY + 5, null, null, "center");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Dean, Student Welfare", 165, finalY + 10, null, null, "center");
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont("helvetica", "italic");
    doc.text("Note: This is a system-generated receipt and is valid without a physical signature.", 105, finalY + 25, null, null, "center");

    doc.save(`Receipt_${formattedID}.pdf`);
};
  const sortedList = getSortedHistory();

  return (
    <div className="dashboard-container" style={{background: theme.bg, minHeight: '100vh', transition: '0.3s', position:'relative'}}>
      
      {/* NAVBAR */}
      <nav className="navbar" style={{background: darkMode ? '#1f1f1f' : '#3498db', borderBottom: darkMode ? '1px solid #333' : 'none'}}>
        <h2 style={{color: 'white'}}>🎓 Student Dashboard</h2>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            <button onClick={() => setDarkMode(!darkMode)} style={{background:'transparent', border:'1px solid white', color:'white', borderRadius:'20px', padding:'5px 15px', cursor:'pointer'}}>
                {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={()=>{localStorage.removeItem('token'); navigate('/login')}} style={{background:'white', color:'black'}}>Logout</button>
        </div>
      </nav>

      {/* 📢 SCROLLING HEADLINE */}
      <div style={{ background: darkMode ? '#ff4d4d' : '#fff3cd', color: darkMode ? 'white' : '#856404', padding: '10px 0', fontSize: '14px', fontWeight: 'bold', borderBottom: `1px solid ${theme.border}`, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div className="marquee-text">
          ⚠️ IMPORTANT: Canteen will remain closed tomorrow for maintenance. | 📢 Last date for Exam Form submission is extended to 20th Jan. | 🏆 Annual Sports registrations are now open!
        </div>
      </div>

      <div className="main-content" style={{padding:'20px'}}>

        {/* STATS CARDS */}
        <div style={{display:'flex', gap:'15px', marginBottom:'25px', flexWrap:'wrap'}}>
            <div style={{flex:1, minWidth:'140px', background: darkMode ? '#2c3e50' : '#ffffff', padding:'15px', borderRadius:'12px', textAlign:'center', boxShadow: theme.shadow, borderTop: '4px solid #3498db'}}>
                <span style={{fontSize:'20px'}}>📝</span>
                <h3 style={{margin:'5px 0', color: theme.text}}>{history.length}</h3>
                <p style={{margin:0, fontSize:'12px', color: theme.subText}}>Total Filed</p>
            </div>
            <div style={{flex:1, minWidth:'140px', background: darkMode ? '#2c3e50' : '#ffffff', padding:'15px', borderRadius:'12px', textAlign:'center', boxShadow: theme.shadow, borderTop: '4px solid #2ecc71'}}>
                <span style={{fontSize:'20px'}}>✅</span>
                <h3 style={{margin:'5px 0', color: theme.text}}>{history.filter(i => i.status === 'Resolved').length}</h3>
                <p style={{margin:0, fontSize:'12px', color: theme.subText}}>Resolved</p>
            </div>
            <div style={{flex:1, minWidth:'140px', background: darkMode ? '#2c3e50' : '#ffffff', padding:'15px', borderRadius:'12px', textAlign:'center', boxShadow: theme.shadow, borderTop: '4px solid #f1c40f'}}>
                <span style={{fontSize:'20px'}}>⏳</span>
                <h3 style={{margin:'5px 0', color: theme.text}}>{history.filter(i => i.status !== 'Resolved').length}</h3>
                <p style={{margin:0, fontSize:'12px', color: theme.subText}}>Pending</p>
            </div>
            <div style={{flex:1, minWidth:'140px', background: darkMode ? '#2c3e50' : '#ffffff', padding:'15px', borderRadius:'12px', textAlign:'center', boxShadow: theme.shadow, borderTop: '4px solid #9b59b6'}}>
                <span style={{fontSize:'20px'}}>🏆</span>
                <h3 style={{margin:'5px 0', color: theme.text}}>{history.reduce((acc, curr) => acc + (curr.upvotes || 0), 0) * 5}</h3>
                <p style={{margin:0, fontSize:'12px', color: theme.subText}}>Impact Points</p>
            </div>
        </div>
        
        {/* COMPLAINT FORM */}
        <div className="form-card" style={{background: theme.card, color: theme.text, boxShadow: theme.shadow, border: grievance.category === 'Ragging/Bullying' ? '2px solid red' : `1px solid ${theme.border}`, marginBottom: '30px'}}>
          <h3>📝 New Complaint</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{marginBottom:'15px'}}>
                <label>Category:</label>
                <select value={grievance.category} onChange={(e)=>setGrievance({...grievance, category:e.target.value})} style={{width:'100%', padding:'10px', background: theme.inputBg, color: theme.text, border:`1px solid ${theme.border}`}}>
                    <option>Academic</option><option>Sanitation</option><option>Infrastructure</option><option>Canteen</option><option style={{color:'red', fontWeight:'bold'}}>Ragging/Bullying</option><option>Others</option>
                </select>
            </div>
            
            <div className="form-group" style={{marginBottom:'15px'}}>
                <label>Urgency:</label>
                <select value={grievance.priority} disabled={grievance.category === 'Ragging/Bullying'} onChange={(e)=>setGrievance({...grievance, priority:e.target.value})} style={{width:'100%', padding:'10px', background: grievance.category === 'Ragging/Bullying' ? '#ffe6e6' : theme.inputBg, color: grievance.category === 'Ragging/Bullying'?'black':theme.text, border:`1px solid ${theme.border}`}}>
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
            </div>

            <div className="form-group" style={{marginBottom:'15px'}}>
                <label>📸 Image URL:</label>
                <input type="text" placeholder="Paste link..." value={grievance.imageUrl} onChange={(e)=>setGrievance({...grievance, imageUrl:e.target.value})} style={{width:'100%', padding:'10px', background: theme.inputBg, color: theme.text, border:`1px solid ${theme.border}`}} />
            </div>

            <div className="form-group" style={{marginBottom:'15px', position: 'relative'}}>
                <label>Message:</label>
                <textarea rows="3" value={grievance.message} onChange={(e)=>setGrievance({...grievance, message:e.target.value})} required placeholder="Type here..." style={{width:'100%', padding:'10px', paddingRight:'40px', background: theme.inputBg, color: theme.text, border: isAbusive ? '2px solid red' : `1px solid ${theme.border}`}}></textarea>
                <button type="button" onClick={startListening} style={{position: 'absolute', right: '10px', bottom: '10px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer'}}>🎙️</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', padding: '10px', background: darkMode ? '#2d2d2d' : '#f0f4f8', borderRadius: '8px', border: `1px dashed ${theme.border}` }}>
                <input 
                    type="checkbox" 
                    id="anonymousCheck"
                    checked={grievance.isAnonymous} 
                    disabled={grievance.category === 'Ragging/Bullying'}
                    onChange={(e) => setGrievance({...grievance, isAnonymous: e.target.checked})}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="anonymousCheck" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {grievance.category === 'Ragging/Bullying' ? "🕵️ Anonymous (Mandatory for Safety)" : "🕵️ Post Anonymously (Hide my identity)"}
                </label>
            </div>

            {isAbusive && <div style={{color:'red', fontSize:'14px', marginBottom:'10px', fontWeight:'bold', textAlign:'center', background:'#ffe6e6', padding:'5px', borderRadius:'5px'}}>⚠️ Please use polite language.</div>}

            <button type="submit" className="submit-btn" disabled={isAbusive} style={{width:'100%', background: isAbusive ? '#95a5a6' : (grievance.category === 'Ragging/Bullying'?'red':'#2c3e50'), cursor: isAbusive ? 'not-allowed' : 'pointer', opacity: isAbusive ? 0.7 : 1}}>{isAbusive ? '🚫 Cannot Submit' : 'Submit'}</button>
          </form>
        </div>

        {/* LIST SECTION */}
        <div className="status-card" style={{background: 'transparent', boxShadow: 'none', padding: 0}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', flexWrap:'wrap', gap:'10px'}}>
            <h3 style={{color: theme.text, margin:0}}>📢 Public Wall</h3>
            <div style={{display:'flex', gap:'10px'}}>
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} style={{padding:'8px', borderRadius:'20px', border:`1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, cursor:'pointer'}}>
                    <option value="Newest">🕒 Newest First</option><option value="Oldest">🕰️ Oldest First</option><option value="Most Upvoted">🔥 Most Upvoted</option><option value="High Priority">⚠️ High Priority</option>
                </select>
                <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{padding:'8px', borderRadius:'20px', border:`1px solid ${theme.border}`, width:'150px', background: theme.inputBg, color: theme.text, outline:'none'}}/>
            </div>
          </div>

          {sortedList.length > 0 ? (
            sortedList.map((item) => (
                <div key={item._id} className="history-item" style={{background: item.category === 'EMERGENCY' ? '#ffe6e6' : theme.card, color: item.category === 'EMERGENCY' ? 'red' : theme.text, border: item.category === 'EMERGENCY' ? '2px solid red' : `1px solid ${theme.border}`, boxShadow: theme.shadow, marginBottom: '15px', padding: '15px', borderRadius: '10px'}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <span style={{fontSize:'24px'}}>{getIcon(item.category)}</span>
                            <div>
                                <strong>{item.category}</strong>
                                <div style={{fontSize:'10px', color: theme.subText}}>
                                    By: {item.isAnonymous ? '👤 Anonymous Student' : '🆔 Verified Student'}
                                </div>
                            </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <span style={{background:item.priority==='High'?'#ff4d4d':item.priority==='Medium'?'orange':'#2ecc71', color:'white', padding:'4px 10px', borderRadius:'20px', fontSize:'11px'}}>{item.priority}</span>
                            <div style={{fontSize:'10px', color: theme.subText, marginTop:'5px'}}>🕒 {timeAgo(item.date)}</div>
                        </div>
                    </div>
                    
                    {item.imageUrl && <img src={item.imageUrl} alt="Proof" style={{width:'100%', marginTop:'10px', maxHeight:'200px', objectFit:'cover', borderRadius:'5px'}} />}
                    <div style={{
                background: darkMode ? '#333' : '#f9f9f9', 
                padding:'15px', 
                margin:'10px 0', 
                borderRadius:'5px',
                borderLeft: item.priority === 'High' ? '4px solid red' : 'none'
            }}>
                {/* 1. Message Text (Yahan change kiya hai - .replace lagaya hai) */}
                <div style={{ whiteSpace: 'pre-wrap', color: darkMode ? '#fff' : '#000' }}>
                    {item.message.split('http')[0].replace('📍 Live Location:', '')}
                </div>

                {/* 2. Blue Button */}
                {item.message.includes('http') && (
                    <a 
                        href={`http${item.message.split('http')[1]}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{
                            display: 'inline-block',
                            marginTop: '5px',
                            padding: '10px 15px',
                            background: '#3498db',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}
                    >
                        📍 Check My Location on Map ↗
                    </a>
                )}
            </div>
                    {renderProgressBar(item.status)}
                    
                    {item.adminReply && <div style={{padding:'10px', background: darkMode ? '#1b3a24' : '#e8f5e9', border:'1px solid #c8e6c9', borderRadius:'5px', marginBottom:'10px'}}><strong style={{color:'#2ecc71'}}>👨‍🏫 Admin:</strong> {item.adminReply}</div>}

                    {/* 🔥 Updated Stars UI with Edit Option */}
                    {item.status === 'Resolved' && (
                        <div style={{marginTop: '15px', padding: '15px', border: '1px dashed #3498db', borderRadius: '10px', background: darkMode ? '#1a2634' : '#f0f7ff'}}>
                            
                            {item.feedback && editingId !== item._id ? (
                                <div style={{fontSize: '13px'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <span style={{fontWeight:'bold', color: theme.text}}>Your Feedback:</span>
                                        <button 
                                            onClick={() => {
                                                setEditingId(item._id);
                                                setRatings({ ...ratings, [item._id]: item.userRating });
                                                setFeedbackText({ ...feedbackText, [item._id]: item.feedback });
                                            }} 
                                            style={{background:'transparent', border:'none', color:'#3498db', cursor:'pointer', fontSize:'12px'}}
                                        >
                                            ✏️ Edit
                                        </button>
                                    </div>
                                    <div style={{margin:'5px 0', color: '#f1c40f', fontSize:'18px'}}>
                                        {'★'.repeat(item.userRating)}{'☆'.repeat(5-item.userRating)}
                                    </div>
                                    <p style={{fontStyle:'italic', color: theme.subText, margin:0}}>"{item.feedback}"</p>
                                </div>
                            ) : (
                                <>
                                    <label style={{fontSize: '13px', fontWeight: 'bold', color: theme.text}}>
                                        {item.feedback ? "Update your rating:" : "Rate the solution (Mandatory):"}
                                    </label>
                                    
                                    <div style={{margin: '10px 0'}}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span 
                                                key={star} 
                                                onClick={() => setRatings({ ...ratings, [item._id]: star })}
                                                style={{ cursor: 'pointer', fontSize: '25px', color: star <= (ratings[item._id] || 0) ? '#f1c40f' : '#ccc', marginRight: '5px' }}
                                            >★</span>
                                        ))}
                                    </div>

                                    <div style={{display:'flex', gap:'8px'}}>
                                        <input 
                                            type="text" 
                                            placeholder="Update your comments..." 
                                            value={feedbackText[item._id] || ''} 
                                            onChange={(e) => setFeedbackText({...feedbackText, [item._id]: e.target.value})}
                                            style={{flex: 1, padding: '8px', borderRadius: '5px', border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text}}
                                        />
                                        <button onClick={() => submitFeedback(item._id)} style={{background: '#2ecc71', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>
                                            {item.feedback ? "Update" : "Submit"}
                                        </button>
                                        {item.feedback && (
                                            <button onClick={() => setEditingId(null)} style={{background: 'transparent', border: `1px solid ${theme.border}`, color: theme.text, padding: '8px', borderRadius: '5px'}}>Cancel</button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    <div style={{marginTop:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{fontSize:'12px', color: theme.subText}}>Status: <b>{item.status}</b></div>
                        <div style={{display:'flex', gap:'10px'}}>
                            {( item.status === 'Resolved') && (
                                <button onClick={() => downloadReceipt(item)} style={{background: 'transparent', border: `1px solid ${theme.subText}`, color: theme.text, padding: '6px', borderRadius: '5px', cursor: 'pointer', fontSize:'12px'}}>🖨️ Receipt</button>
                            )}
                            {item.status === 'Pending' && <button onClick={() => handleDelete(item._id)} style={{background:'#7f8c8d', color:'white', border:'none', padding:'6px', borderRadius:'5px', cursor:'pointer'}}>🗑️ Withdraw</button>}
                            {item.status === 'Resolved' && <button onClick={() => handleReopen(item._id, item.category)} style={{background:'#d63031', color:'white', border:'none', padding:'6px', borderRadius:'5px'}}>❌ Reopen</button>}
                            <button onClick={() => handleUpvote(item._id)} style={{background:'#3498db', color:'white', border:'none', padding:'6px 15px', borderRadius:'20px'}}>👍 {item.upvotes || 0}</button>
                        </div>
                    </div>
                </div>
            ))
          ) : (
            <div style={{textAlign: 'center', padding: '50px', background: theme.card, borderRadius: '15px', boxShadow: theme.shadow, border: `1px dashed ${theme.border}`}}>
              <div style={{fontSize: '60px', marginBottom: '15px'}}>🔍</div>
              <h3 style={{color: theme.text, marginBottom: '5px'}}>No Grievances Found</h3>
              <p style={{color: theme.subText, fontSize: '14px'}}>Hume results nahi mile.</p>
              <button onClick={() => setSearchTerm('')} style={{marginTop: '20px', background: '#3498db', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold'}}>Clear Search</button>
            </div>
          )}
        </div>
      </div>

      {/* SOS BUTTON & MODAL */}
      <button onClick={() => setShowSOS(!showSOS)} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', background: 'red', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,0,0,0.5)', zIndex: 1000, animation: 'pulse 1.5s infinite' }}>🆘</button>
      {showSOS && (
        <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:1001, display:'flex', justifyContent:'center', alignItems:'center' }}>
            <div style={{background:'white', padding:'30px', borderRadius:'10px', textAlign:'center', width:'300px'}}>
                <h2 style={{color:'red', marginTop:0}}>🚨 EMERGENCY</h2>
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <button onClick={() => handleSOS('MEDICAL')} style={{padding:'10px', background:'#e74c3c', color:'white', border:'none', borderRadius:'5px'}}>🚑 Medical</button>
                    <button onClick={() => handleSOS('FIRE')} style={{padding:'10px', background:'#e67e22', color:'white', border:'none', borderRadius:'5px'}}>🔥 Fire</button>
                    <button onClick={() => handleSOS('SECURITY')} style={{padding:'10px', background:'#2c3e50', color:'white', border:'none', borderRadius:'5px'}}>👮 Security</button>
                    <button 
    onClick={() => handleSOS('RAGGING')} 
    style={{
        padding: '10px 20px',
        background: '#8e44ad',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginLeft: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
    }}
>
    🚫 REPORT RAGGING (GPS)
</button>
                </div>
                <button onClick={() => setShowSOS(false)} style={{marginTop:'20px', background:'transparent', border:'none'}}>Cancel</button>
            </div>
        </div>
      )}

      <style>{`
        .marquee-text { display: inline-block; padding-left: 100%; animation: marquee 25s linear infinite; }
        @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }
        @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); } 70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); } }
      `}</style>
    </div>
  );
};

export default Dashboard;