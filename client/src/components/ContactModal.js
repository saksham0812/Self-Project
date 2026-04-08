import React, { useState, useRef, useEffect } from 'react'; 
import emailjs from '@emailjs/browser'; 
import { FaPhone, FaTimes, FaWhatsapp, FaEnvelope, FaSpinner, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const ContactModal = ({ onClose }) => {
    
    const [loading, setLoading] = useState(false);
    
    // --- 📶 1. REAL-TIME ONLINE/OFFLINE CHECKER (Updated Logic) ---
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // --- 2. WhatsApp Function ---
    const sendWhatsapp = () => {
        const myNumber = "917817096763";  
        
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
            const message = `🆘 HELP! I am in emergency. Track my Live Location here: ${mapLink}`;
            const url = `https://wa.me/${myNumber}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        
        }, () => {
            const message = "🆘 HELP! I am in emergency at College Campus. (Location permission denied)";
            const url = `https://wa.me/${myNumber}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        });
    };

    // --- 3. Email Function ---
    const sendEmail = (e) => {
        e.preventDefault();
        if (!isOnline) {
            alert("⚠️ No Internet Connection! Please use the Calling Buttons.");
            return; // Yahin se wapas bhej do, aage mat badho
        }
        setLoading(true);

        const serviceID = "service_jydkwnm";  
        const templateID = "jp9l21k";         
        const publicKey = "qR0DjyNeZ-db_Wkfs";  
        
        const templateParams = {
            title: "Emergency Alert",      
            name: "Saksham (Student)",     
            email: "student@help.com",     
            message: "EMERGENCY! Please send security immediately.",
        };

        emailjs.send(serviceID, templateID, templateParams, publicKey)
            .then((response) => {
                setLoading(false);
                alert("✅ Alert Sent Successfully to Security Control Room!");
                onClose();
            }, (error) => {
                setLoading(false);
                alert("❌ Failed to send alert.");
                console.log('FAILED...', error);
            });
    };

    // --- 🔊 4. SIREN LOGIC ---
    const [isSirenPlaying, setIsSirenPlaying] = useState(false);
    
    // Wikimedia Link (Reliable Audio)
    const sirenAudio = useRef(new Audio("https://upload.wikimedia.org/wikipedia/commons/a/a2/Emergency_Siren.ogg"));

    const toggleSiren = () => {
        if (isSirenPlaying) {
            sirenAudio.current.pause();
            sirenAudio.current.currentTime = 0; 
            setIsSirenPlaying(false);
        } else {
            sirenAudio.current.loop = true; 
            sirenAudio.current.play().catch(e => console.log("Audio Error:", e));
            setIsSirenPlaying(true);
        }
    };

    const contacts = [
        { name: "Police Control", number: "100", color: "#e74c3c" },
        { name: "Ambulance", number: "102", color: "#3498db" },
        { name: "Women Helpline", number: "1091", color: "#9b59b6" },
        { name: "College Security", number: "+91-9876543210", color: "#f39c12" },
        { name: "Fire Brigade", number: "101", color: "#e67e22" }
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(3px)'
        }}>
            <div style={{
                // --- PROFESSIONAL LOOK START ---
                background: '#f9f9f9', 
                borderTop: '6px solid #e74c3c', 
                padding: '25px', 
                borderRadius: '15px',
                width: '90%', 
                maxWidth: '350px', 
                position: 'relative',
                boxShadow: '0 15px 30px rgba(0,0,0,0.3)', 
                animation: 'fadeIn 0.3s ease'
                // --- PROFESSIONAL LOOK END ---
            }}>
                
                {/* --- 📶 NETWORK STATUS BAR --- */}
                <div style={{
                    position: 'absolute',
                    top: '-15px', left: '50%', transform: 'translateX(-50%)',
                    background: isOnline ? '#2ecc71' : '#7f8c8d', 
                    color: 'white',
                    padding: '5px 15px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                    zIndex: 1002
                }}>
                    {isOnline ? "🟢 SYSTEM ONLINE" : "🔴 OFFLINE MODE"}
                </div>

                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#666' }}><FaTimes /></button>
                <h3 style={{ textAlign: 'center', margin: '15px 0 20px 0', color: '#333' }}>🚨 Emergency Help</h3>

                {/* --- WHATSAPP & EMAIL BUTTONS --- */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button onClick={sendWhatsapp} style={{ flex: 1, background: '#25D366', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold' }}>
                        <FaWhatsapp size={18} /> WhatsApp
                    </button>
                    <button onClick={sendEmail} disabled={loading} style={{ flex: 1, background: loading ? '#95a5a6' : '#ea4335', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold' }}>
                        {loading ? <><FaSpinner className="fa-spin"/> Sending...</> : <><FaEnvelope size={18} /> Email Alert</>}
                    </button>
                </div>

                {/* --- SIREN BUTTON --- */}
                <button onClick={toggleSiren} style={{ 
                    width: '100%', 
                    marginTop: '5px', 
                    marginBottom: '20px',
                    background: isSirenPlaying ? '#e74c3c' : '#333', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '10px', 
                    fontWeight: 'bold',
                    animation: isSirenPlaying ? 'pulse 0.5s infinite' : 'none'
                }}>
                    {isSirenPlaying ? <FaVolumeMute size={20}/> : <FaVolumeUp size={20}/>}
                    {isSirenPlaying ? "STOP SIREN" : "PLAY LOUD SIREN"}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {contacts.map((item, index) => (
                        <a key={index} href={`tel:${item.number}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', background: '#fff', padding: '12px', borderRadius: '8px', borderLeft: `5px solid ${item.color}`, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: '#333' }}>
                            <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                            <span style={{ display:'flex', alignItems:'center', gap:'5px', color: item.color, fontWeight:'bold' }}><FaPhone size={14} /> {item.number}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContactModal;