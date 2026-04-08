import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css'; 


const sirenAudio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
sirenAudio.loop = true;

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('All'); 
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, highPriority: 0, avgRating: 0 });
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
 
const [adminNote, setAdminNote] = useState(localStorage.getItem('adminMemo') || '');
const [countdown, setCountdown] = useState(30);


useEffect(() => {
  const timer = setInterval(() => {
    setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
  }, 1000);
  return () => clearInterval(timer);
}, []);

const saveMemo = (text) => {
  setAdminNote(text);
  localStorage.setItem('adminMemo', text);
};

  useEffect(() => { 
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 30000);
    return () => {
        clearInterval(interval);
        sirenAudio.pause();
    };
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/grievances');
      const data = res.data || [];
      
      const ratedComplaints = data.filter(item => item.userRating > 0);
      const avg = ratedComplaints.length > 0 
        ? (ratedComplaints.reduce((acc, curr) => acc + curr.userRating, 0) / ratedComplaints.length).toFixed(1) 
        : 0;

      setStats({
        total: data.length,
        pending: data.filter(item => item.status === 'Pending').length,
        resolved: data.filter(item => item.status === 'Resolved').length,
        highPriority: data.filter(item => (item.priority === 'High' || item.category === 'Ragging/Bullying' || item.category === 'EMERGENCY') && item.status === 'Pending').length,
        avgRating: avg
      });

      const hasCriticalAlert = data.some(item => 
        (item.category === 'Ragging/Bullying' || item.category === 'EMERGENCY') && 
        item.status === 'Pending'
      );

      if (hasCriticalAlert) {
        setIsSirenActive(true);
        sirenAudio.play().catch(() => console.log("Click on page to enable Audio Siren 🔊"));
      } else {
        stopSiren();
      }

      const sortedData = data.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      setComplaints(sortedData);
    } catch (error) { console.error("Error fetching data"); }
  };

  const stopSiren = () => {
    setIsSirenActive(false);
    sirenAudio.pause();
    sirenAudio.currentTime = 0;
  };

  const downloadReport = () => {
    const headers = ["Date", "Category", "Message", "Status", "Priority", "Upvotes"];
    const rows = complaints.map(c => [
        new Date(c.createdAt).toLocaleDateString(),
        c.category,
        c.message.replace(/,/g, " "), 
        c.status,
        c.priority,
        c.upvotes || 0
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "College_Grievance_Report.csv");
    document.body.appendChild(link);
    link.click();
  };

  const markResolved = async (id) => {
    const reply = window.prompt("Resolution Note for Student:");
    if (reply) { 
        await axios.put(`http://localhost:5000/api/grievances/${id}`, { status: 'Resolved', adminReply: reply }); 
        fetchComplaints(); 
    }
  };

  const markProcessing = async (id) => { 
    await axios.put(`http://localhost:5000/api/grievances/${id}`, { status: 'In Progress' }); 
    fetchComplaints(); 
  };

  const deleteComplaint = async (id) => { 
    if(window.confirm("Delete permanently?")) { 
        await axios.delete(`http://localhost:5000/api/grievances/${id}`); 
        fetchComplaints(); 
    }
  };

  const changePriority = async (id, newP) => { 
    await axios.put(`http://localhost:5000/api/grievances/${id}`, { priority: newP }); 
    fetchComplaints(); 
  };

  const getIcon = (c) => { 
    if(c==='Academic') return '📚'; if(c==='Ragging/Bullying') return '🚨'; 
    if(c==='Canteen') return '🍔'; if(c==='Sanitation') return '🧹'; 
    if(c==='Infrastructure') return '🏢'; return '📝'; 
  };

  const filteredComplaints = complaints.filter((item) => {
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch = item.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.userEmail && item.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesDate = !dateFilter || new Date(item.createdAt).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    
    return matchesTab && matchesSearch && matchesCategory && matchesDate;
  });
  // --- SIMPLE AI SENTIMENT ANALYZER ---
  const analyzeSentiment = (text) => {
    if (!text) return null; // Agar text nahi hai toh kuch mat dikhao
    const lowerText = text.toLowerCase();
    
    // 🔴 Critical Keywords
    if (['suicide', 'kill', 'die', 'murder', 'blood', 'attack', 'ragging', 'bully'].some(w => lowerText.includes(w))) {
        return { label: 'CRITICAL', color: '#721c24', bg: '#f8d7da', border: '#f5c6cb', icon: '🆘' };
    }
    // 🟠 Urgent Keywords
    if (['urgent', 'emergency', 'help', 'threat', 'scared', 'afraid'].some(w => lowerText.includes(w))) {
        return { label: 'Urgent', color: '#856404', bg: '#fff3cd', border: '#ffeeba', icon: '⚠️' };
    }
    // 🟢 Agar sab normal hai toh return NULL (Har message pe badge dikhana zaroori nahi)
    return null; 
  };

  return (
    <div className={`dashboard-container ${isSirenActive ? 'siren-bg' : ''}`}>
      <nav className="navbar" style={{backgroundColor: isSirenActive ? '#ff0000' : '#2c3e50', transition: '0.5s', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 20px', position:'sticky', top:0, zIndex:100}}>
        <h2 style={{color: 'white', margin:0}}>👮‍♂️ Admin Control Panel {isSirenActive && "🚨 ALERT!"}</h2>
        <div style={{display:'flex', gap:'10px'}}>
            <button onClick={downloadReport} style={{background:'#27ae60', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>📥 Export Report</button>
            {isSirenActive && (
                <button onClick={stopSiren} style={{background:'white', color:'red', fontWeight:'bold', border:'none', padding:'10px 20px', borderRadius:'20px', cursor:'pointer', animation:'pulse 1s infinite'}}>
                    🔕 STOP SIREN
                </button>
            )}
        </div>
      </nav>

      <div className="main-content" style={{padding: '20px'}}>
        {/* 🕒 LIVE WELCOME HEADER */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#2c3e50' }}>
                    {new Date().getHours() < 12 ? 'Good Morning ☀️' : new Date().getHours() < 17 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙'}, Admin
                </h1>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                    Here's what's happening with the college grievances today.
                </p>
            </div>
            <div style={{ textAlign: 'right', background: '#ecf0f1', padding: '10px 20px', borderRadius: '10px', border: '1px solid #dcdde1' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>TODAY'S DATE</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
        </div>
        {/* 🕒 LIVE REFRESH & MEMO SECTION */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px' }}>
    
    {/* Left Side: Auto Refresh Status */}
    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', borderLeft:'5px solid #4e73df' }}>
        <div>
            <h4 style={{margin:0, color:'#2c3e50'}}>🔄 Live Sync Active</h4>
            <small style={{color:'#888'}}>Next update in: <b style={{color:'#4e73df'}}>{countdown}s</b></small>
        </div>
        <button onClick={fetchComplaints} style={{background:'#f8f9fc', border:'1px solid #ddd', padding:'8px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Refresh Now</button>
    </div>

    {/* Right Side: Admin Sticky Memo */}
    <div style={{ background: '#fff9c4', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border:'1px solid #fbc02d' }}>
        <h4 style={{margin:'0 0 10px 0', fontSize:'14px', display:'flex', alignItems:'center'}}>📌 Admin Memo (Private)</h4>
        <textarea 
            value={adminNote} 
            onChange={(e) => saveMemo(e.target.value)}
            placeholder="Write quick notes for yourself here..."
            style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', fontSize: '13px', outline: 'none', height: '40px', fontFamily: 'inherit', color: '#856404' }}
        />
    </div>
</div>
        
        
        <div style={{display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap'}}>
            <div style={{flex:1, minWidth:'150px', background:'#4e73df', padding:'20px', borderRadius:'10px', color:'white', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}><h3>{stats.total}</h3><span>Total Cases</span></div>
            <div style={{flex:1, minWidth:'150px', background:'#f6c23e', padding:'20px', borderRadius:'10px', color:'white', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}><h3>{stats.pending}</h3><span>Pending</span></div>
            <div style={{flex:1, minWidth:'150px', background:'#1cc88a', padding:'20px', borderRadius:'10px', color:'white', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}><h3>{stats.resolved}</h3><span>Resolved</span></div>
            <div style={{flex:1, minWidth:'150px', background: isSirenActive ? 'red' : '#e74a3b', padding:'20px', borderRadius:'10px', color:'white', animation: isSirenActive ? 'pulse 1s infinite' : 'none', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
                <h3>{stats.highPriority}</h3><span>Critical</span>
            </div>
            <div style={{flex:1, minWidth:'150px', background:'#6f42c1', padding:'20px', borderRadius:'10px', color:'white', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
                <h3>⭐ {stats.avgRating}/5</h3><span>Avg. Satisfaction</span>
            </div>
        </div>

        
        <div style={{background:'white', padding:'20px', borderRadius:'10px', marginBottom:'25px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'14px', fontWeight:'bold', color:'#555'}}>
                <span>Overall Resolution Success Rate</span>
                <span>{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</span>
            </div>
            <div style={{width:'100%', background:'#eee', height:'12px', borderRadius:'10px', overflow:'hidden'}}>
                <div style={{width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`, background:'#1cc88a', height:'100%', transition:'0.8s ease-in-out'}}></div>
            </div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={{display:'flex', gap:'10px', marginBottom:'20px', borderBottom:'2px solid #eee', paddingBottom:'10px'}}>
            {['All', 'Pending', 'In Progress', 'Resolved'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{padding:'10px 20px', borderRadius:'5px', border:'none', cursor:'pointer', fontWeight:'bold', background: activeTab === tab ? '#2c3e50' : '#eee', color: activeTab === tab ? 'white' : '#555', transition:'0.3s'}}>
                    {tab}
                </button>
            ))}
        </div>

       
        <div className="status-card" style={{width:'100%', marginBottom:'20px', display:'flex', gap:'10px', flexWrap: 'wrap', background:'none', boxShadow:'none', padding:0}}>
            <input type="text" placeholder="🔍 Search message or student email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{padding:'12px', flex:'2', minWidth: '250px', borderRadius:'8px', border:'1px solid #ddd'}} />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{padding:'10px', flex: '1', borderRadius:'8px', border:'1px solid #ddd'}}>
                <option value="All">All Categories</option>
                <option>Ragging/Bullying</option><option>Academic</option><option>Sanitation</option><option>Infrastructure</option><option>Canteen</option><option>Others</option>
            </select>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{padding:'10px', flex: '1', borderRadius:'8px', border:'1px solid #ddd'}} />
            {dateFilter && <button onClick={() => setDateFilter('')} style={{background: '#95a5a6', color: 'white', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer'}}>Clear</button>}
        </div>

       
        <div className="status-card" style={{width:'100%', background:'transparent', boxShadow:'none', padding:0}}>
          {filteredComplaints.length > 0 ? filteredComplaints.map((item) => (
            <div key={item._id} className="history-item" style={{
                borderLeft: item.status==='Resolved'?'10px solid #1cc88a':item.status==='In Progress'?'10px solid #4e73df':'10px solid #f6c23e', 
                backgroundColor:(item.category==='Ragging/Bullying' || item.category === 'EMERGENCY') && item.status === 'Pending' ? '#fff0f0' : 'white',
                marginBottom:'20px', padding:'25px', borderRadius:'12px', boxShadow:'0 4px 10px rgba(0,0,0,0.05)'
            }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                        <span style={{fontSize:'32px'}}>{getIcon(item.category)}</span>
                        <div>
                            <strong style={{fontSize:'18px', color:'#2c3e50'}}>{item.category}</strong>
                            <div style={{fontSize:'12px', color:'#777', marginTop:'4px'}}>
                                📅 {new Date(item.createdAt).toLocaleString()} | <span style={{color:'#e74a3b', fontWeight:'bold'}}>🔥 {item.upvotes || 0} Upvotes</span>
                            </div>
                        </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                        <label style={{fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'5px', color:'#888'}}>PRIORITY</label>
                        <select value={item.priority||'Low'} onChange={(e)=>changePriority(item._id, e.target.value)} 
                            style={{padding:'5px 10px', borderRadius:'5px', border:'1px solid #ddd', background: item.priority==='High' ? '#ffebee' : 'white'}}>
                            <option>Low</option><option>Medium</option><option>High</option>
                        </select>
                    </div>
                </div>
                {(() => {
                    const sentiment = analyzeSentiment(item.message);
                    return sentiment && (
                        <div style={{
                            marginTop: '15px',
                            display: 'inline-block',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: sentiment.bg,
                            color: sentiment.color,
                            border: `1px solid ${sentiment.border}`,
                            fontSize: '13px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            {sentiment.icon} AI Analysis: {sentiment.label} Detected
                        </div>
                    );
                })()}

                
                <div style={{margin:'20px 0', padding:'15px', background:'#f8f9fc', borderRadius:'8px', borderLeft:'4px solid #ddd'}}>
                    <p style={{margin:0, color:'#333', fontSize:'15px', lineHeight:'1.6', wordBreak: 'break-word'}}>
                        <b>Message:</b> 
                        
                        {/* 1. Normal Text dikhayega */}
                        <span> {item.message.split('http')[0]} </span>

                        {/* 2. Agar Link hai toh use Blue aur Clickable banayega */}
                        {item.message.includes('http') && (
                            <a 
                                href={`http${item.message.split('http')[1]}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{
                                    color: '#007bff', 
                                    fontWeight: 'bold', 
                                    textDecoration: 'underline', 
                                    cursor: 'pointer',
                                    marginLeft: '5px'
                                }}
                            >
                                {`http${item.message.split('http')[1]}`}
                            </a>
                        )}
                    </p>
                </div>
                {/* --- END MESSAGE --- */}

                <div style={{marginBottom:'15px', display:'flex', gap:'10px', flexWrap:'wrap'}}>
                    {(item.upvotes > 15) && <span style={{background:'#fff3cd', color:'#856404', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', border:'1px solid #ffeeba'}}>🔥 Popular Issue</span>}
                    {(item.category === 'Ragging/Bullying') && <span style={{background:'#f8d7da', color:'#721c24', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', border:'1px solid #f5c6cb'}}>⚠️ Strict Action Needed</span>}
                </div>

                {item.imageUrl && (
                    <div style={{marginBottom:'15px'}}>
                        <img src={item.imageUrl} alt="Proof" 
                            style={{width:'150px', height:'150px', objectFit:'cover', borderRadius:'8px', cursor:'pointer', border:'2px solid #eee',
                            filter: item.category === 'Ragging/Bullying' ? 'blur(12px)' : 'none'}}
                            onMouseOver={(e)=>e.currentTarget.style.filter='none'} 
                            onMouseOut={(e)=>e.currentTarget.style.filter=item.category==='Ragging/Bullying'?'blur(12px)':'none'}
                            onClick={()=>window.open(item.imageUrl, '_blank')}
                        />
                        <p style={{fontSize:'10px', color:'#999', marginTop:'5px'}}>Hover to unblur image</p>
                    </div>
                )}

                <div style={{fontSize:'13px', color:'#666', marginBottom:'15px', display:'flex', justifyContent:'space-between'}}>
                    {/* ✅ CLICK TO COPY EMAIL FEATURE ADDED HERE */}
                    <span>👤 User: 
                        <b 
                            onClick={() => {
                                if(!item.isAnonymous && item.userEmail) {
                                    navigator.clipboard.writeText(item.userEmail);
                                    alert("Email copied: " + item.userEmail);
                                }
                            }} 
                            style={{ 
                                cursor: item.isAnonymous ? 'default' : 'pointer', 
                                color: item.isAnonymous ? '#2c3e50' : '#4e73df', 
                                textDecoration: item.isAnonymous ? 'none' : 'underline',
                                marginLeft: '5px'
                            }}
                            title={item.isAnonymous ? "" : "Click to copy email"}
                        >
                            {item.isAnonymous ? "🕵️ Anonymous" : item.userEmail || "Verified Student"}
                        </b>
                    </span>
                    <span style={{fontWeight:'bold', color: item.status==='Resolved'?'green':'#f6c23e'}}>Status: {item.status}</span>
                </div>

                {item.adminReply && (
                    <div style={{background:'#e8f5e9', padding:'12px', borderRadius:'8px', marginBottom:'15px', border:'1px solid #c8e6c9'}}>
                        <b style={{color:'#2e7d32'}}>📝 Admin Note:</b> {item.adminReply}
                    </div>
                )}

                {item.status === 'Resolved' && item.userRating > 0 && (
                    <div style={{background:'#fff9c4', padding:'12px', borderRadius:'8px', marginBottom:'15px', border:'1px solid #fbc02d'}}>
                        <div style={{fontWeight:'bold', color:'#f57f17'}}>Student Rating: {'★'.repeat(item.userRating)}{'☆'.repeat(5-item.userRating)}</div>
                        <p style={{margin:'5px 0 0 0', fontStyle:'italic', color:'#555'}}>"{item.feedback}"</p>
                    </div>
                )}
                
                <div style={{display:'flex', gap:'12px', marginTop:'10px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
                    {item.status==='Pending' && <button onClick={()=>markProcessing(item._id)} style={{background:'#4e73df', color:'white', border:'none', padding:'10px 20px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>🚧 Start Processing</button>}
                    {item.status!=='Resolved' && <button onClick={()=>markResolved(item._id)} style={{background:'#1cc88a', color:'white', border:'none', padding:'10px 20px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>✅ Mark Resolved</button>}
                    <button onClick={()=>deleteComplaint(item._id)} style={{background:'none', color:'#e74a3b', border:'1px solid #e74a3b', padding:'10px 20px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>🗑️ Delete</button>
                </div>
            </div>
          )) : <div style={{textAlign: 'center', padding: '100px', color: '#999'}}><p>No complaints found.</p></div>}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .siren-bg { animation: blink-bg 1s infinite; }
        @keyframes blink-bg { 0% { background: #f4f7f6; } 50% { background: #ffe6e6; } 100% { background: #f4f7f6; } }
        .history-item:hover { transform: translateY(-3px); transition: 0.3s; box-shadow: 0 6px 15px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;