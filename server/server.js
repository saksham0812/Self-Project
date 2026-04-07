const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());


mongoose.connect('mongodb://127.0.0.1:27017/college_grievance')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));


const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
}));


const Grievance = mongoose.model('Grievance', new mongoose.Schema({
    category: String,
    message: String,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    adminReply: { type: String, default: "" },
    priority: { type: String, default: 'Low' },
    isPrivate: { type: Boolean, default: false },
    imageUrl: String,
    feedback: { type: String, default: "" },      
    userRating: { type: Number, default: 0 }      
}));

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = new User({ name, email, password });
        await user.save();
        const token = jwt.sign({ id: user._id }, 'secretkey');
        res.json({ token });
    } catch (err) { res.status(500).send("Error"); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) return res.status(400).json({ msg: "Invalid" });
        const token = jwt.sign({ id: user._id }, 'secretkey');
        res.json({ token });
    } catch (err) { res.status(500).send("Error"); }
});

app.get('/api/grievances', async (req, res) => {
    const data = await Grievance.find();
    res.json(data);
});

app.post('/api/grievances', async (req, res) => {
    const newGrievance = new Grievance(req.body);
    await newGrievance.save();
    res.json(newGrievance);
});


app.put('/api/grievances/:id/feedback', async (req, res) => {
    try {
        const { feedback, rating } = req.body;
        const updated = await Grievance.findByIdAndUpdate(
            req.params.id, 
            { $set: { feedback: feedback, userRating: rating } }, 
            { new: true }
        );
        res.json(updated);
    } catch (error) { res.status(500).send("Error saving feedback"); }
});

app.put('/api/grievances/:id', async (req, res) => {
    try {
        const updated = await Grievance.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(updated);
    } catch (error) { res.status(500).send("Error updating"); }
});

app.put('/api/grievances/:id/upvote', async (req, res) => {
    try {
        const updated = await Grievance.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true });
        res.json(updated);
    } catch (error) { res.status(500).send("Error"); }
});
app.delete('/api/grievances/:id', async (req, res) => {
    try {
        await Grievance.findByIdAndDelete(req.params.id);
        res.json({ msg: "Deleted" });
    } catch (error) { res.status(500).send("Error"); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server Started on Port ${PORT}`));