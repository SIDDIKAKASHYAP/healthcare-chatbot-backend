// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (optional - you can start without database first)
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthbot', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// Sample data for demonstration
const symptomDatabase = {
  fever: {
    causes: ["Viral infection", "Bacterial infection", "Heat exhaustion"],
    advice: "Rest, stay hydrated, monitor temperature. Consult doctor if fever persists over 3 days or exceeds 101°F.",
    severity: "medium"
  },
  headache: {
    causes: ["Stress", "Dehydration", "Eye strain", "Tension"],
    advice: "Rest in a dark room, stay hydrated, consider pain relief if needed. Consult doctor if severe or persistent.",
    severity: "low"
  },
  cough: {
    causes: ["Cold", "Allergies", "Respiratory infection"],
    advice: "Stay hydrated, avoid irritants, use honey for throat soothing. Consult doctor if persistent or with blood.",
    severity: "medium"
  },
  "chest pain": {
    causes: ["Muscle strain", "Heartburn", "Heart issues"],
    advice: "SEEK IMMEDIATE MEDICAL ATTENTION. Do not ignore chest pain.",
    severity: "high"
  }
};

const hospitalDatabase = {
  "110001": [
    {
      name: "All India Institute of Medical Sciences (AIIMS)",
      address: "Ansari Nagar, New Delhi - 110029",
      phone: "011-26588500",
      type: "Multi-specialty Government Hospital",
      emergency: true
    },
    {
      name: "Safdarjung Hospital",
      address: "Safdarjung, New Delhi - 110029",
      phone: "011-26165060",
      type: "Government Hospital",
      emergency: true
    }
  ],
  "400001": [
    {
      name: "King Edward Memorial Hospital",
      address: "Acharya Donde Marg, Parel, Mumbai - 400012",
      phone: "022-24136051",
      type: "Government Hospital",
      emergency: true
    },
    {
      name: "Lilavati Hospital",
      address: "A-791, Bandra Reclamation, Mumbai - 400050",
      phone: "022-26430891",
      type: "Private Multi-specialty Hospital",
      emergency: true
    }
  ]
};

// Routes

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

// Symptom checker endpoint
app.post('/api/symptom-check', (req, res) => {
  const { symptoms, age, gender } = req.body;
  
  if (!symptoms || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: 'Symptoms array is required' });
  }
  
  const results = [];
  let maxSeverity = 'low';
  
  symptoms.forEach(symptom => {
    const lowerSymptom = symptom.toLowerCase();
    const match = Object.keys(symptomDatabase).find(key => 
      lowerSymptom.includes(key)
    );
    
    if (match) {
      const info = symptomDatabase[match];
      results.push({
        symptom: match,
        ...info
      });
      
      if (info.severity === 'high') maxSeverity = 'high';
      else if (info.severity === 'medium' && maxSeverity === 'low') maxSeverity = 'medium';
    }
  });
  
  let generalAdvice = "";
  if (maxSeverity === 'high') {
    generalAdvice = "URGENT: Please seek immediate medical attention or call emergency services.";
  } else if (maxSeverity === 'medium') {
    generalAdvice = "Consider consulting a healthcare provider if symptoms persist or worsen.";
  } else {
    generalAdvice = "Monitor symptoms and maintain general health practices. Consult a doctor if concerned.";
  }
  
  res.json({
    results,
    severity: maxSeverity,
    generalAdvice,
    disclaimer: "This is for informational purposes only. Please consult a healthcare professional for proper diagnosis and treatment."
  });
});

// Hospital finder endpoint
app.get('/api/hospitals/:pincode', (req, res) => {
  const { pincode } = req.params;
  
  const hospitals = hospitalDatabase[pincode] || [
    {
      name: "Local Community Health Center",
      address: `Health Street, ${pincode}`,
      phone: "108",
      type: "Primary Health Center",
      emergency: true
    },
    {
      name: "District Hospital",
      address: `Main Road, ${pincode}`,
      phone: "Emergency: 108",
      type: "Government Hospital",
      emergency: true
    }
  ];
  
  res.json({
    pincode,
    hospitals,
    emergencyNumber: "108"
  });
});

// Health tips endpoint
app.get('/api/health-tips', (req, res) => {
  const tips = [
    {
      category: "Nutrition",
      tip: "Eat a rainbow of fruits and vegetables daily for essential vitamins and minerals.",
      importance: "high"
    },
    {
      category: "Exercise",
      tip: "Aim for at least 150 minutes of moderate aerobic activity per week.",
      importance: "high"
    },
    {
      category: "Sleep",
      tip: "Maintain a consistent sleep schedule and aim for 7-9 hours per night.",
      importance: "high"
    },
    {
      category: "Hydration",
      tip: "Drink 8-10 glasses of water daily to stay properly hydrated.",
      importance: "medium"
    },
    {
      category: "Mental Health",
      tip: "Practice stress management techniques like meditation or deep breathing.",
      importance: "high"
    }
  ];
  
  // Return random selection of tips
  const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);
  res.json(randomTips);
});

// Medicine reminder endpoints (simplified without database)
let reminders = []; // In production, this should be in a database

app.get('/api/reminders', (req, res) => {
  res.json(reminders);
});

app.post('/api/reminders', (req, res) => {
  const { medicineName, dosage, frequency, time, startDate } = req.body;
  
  if (!medicineName || !frequency || !time) {
    return res.status(400).json({ error: 'Medicine name, frequency, and time are required' });
  }
  
  const newReminder = {
    id: Date.now().toString(),
    medicineName,
    dosage: dosage || '1 tablet',
    frequency,
    time,
    startDate: startDate || new Date().toISOString(),
    active: true,
    createdAt: new Date().toISOString()
  };
  
  reminders.push(newReminder);
  res.status(201).json(newReminder);
});

app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  reminders = reminders.filter(reminder => reminder.id !== id);
  res.json({ message: 'Reminder deleted successfully' });
});

// Emergency contacts endpoint
app.get('/api/emergency-contacts', (req, res) => {
  const contacts = [
    { name: "National Emergency Services", number: "112", type: "general" },
    { name: "Medical Emergency", number: "108", type: "medical" },
    { name: "Fire Emergency", number: "101", type: "fire" },
    { name: "Police Emergency", number: "100", type: "police" },
    { name: "Women Helpline", number: "1091", type: "women" },
    { name: "Child Helpline", number: "1098", type: "child" }
  ];
  
  res.json(contacts);
});

// Chatbot conversation endpoint
app.post('/api/chat', (req, res) => {
  const { message, conversationId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const lowerMessage = message.toLowerCase();
  let botResponse = "";
  
  // Simple keyword-based responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    botResponse = "Hello! I'm your health assistant. I can help you with symptom checking, finding hospitals, setting medicine reminders, and providing health tips. How can I assist you today?";
  }
  else if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
    botResponse = "I understand you're concerned about fever. Common causes include viral or bacterial infections. Please rest, stay hydrated, and monitor your temperature. If fever persists over 3 days or exceeds 101°F, please consult a doctor immediately.";
  }
  else if (lowerMessage.includes('headache') || lowerMessage.includes('head pain')) {
    botResponse = "Headaches can be caused by stress, dehydration, or eye strain. Try resting in a dark room and staying hydrated. If headaches are severe or persistent, please consult a healthcare provider.";
  }
  else if (lowerMessage.includes('hospital') || lowerMessage.includes('doctor')) {
    botResponse = "I can help you find nearby hospitals and healthcare facilities. Please provide your pincode, and I'll show you the closest options with contact information.";
  }
  else if (lowerMessage.includes('medicine') || lowerMessage.includes('reminder')) {
    botResponse = "I can help you set up medicine reminders to ensure you never miss a dose. This is especially important for maintaining treatment effectiveness. Would you like to set up a reminder?";
  }
  else if (lowerMessage.includes('emergency')) {
    botResponse = "For medical emergencies, please call 108 immediately. For general emergencies, call 112. If you're experiencing chest pain, difficulty breathing, severe bleeding, or loss of consciousness, seek immediate medical attention.";
  }
  else {
    botResponse = "Thank you for your message. I can assist with symptom checking, finding hospitals, medicine reminders, health tips, and emergency information. Could you please be more specific about how I can help you today?";
  }
  
  botResponse += " \n\nDisclaimer: This information is for educational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.";
  
  res.json({
    response: botResponse,
    conversationId: conversationId || Date.now().toString(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Healthcare Chatbot API server running on port ${PORT}`);
  console.log(`Access the API at: http://localhost:${PORT}/api/health`);
});

// Export the app for deployment platforms
module.exports = app;