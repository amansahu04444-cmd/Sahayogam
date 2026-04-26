```🚀 Sahayogam
Smart AI-Powered Resource Allocation System for Social Impact

📌 Overview
Sahayogam is a full-stack AI-powered platform that helps NGOs efficiently manage community needs and volunteer coordination.
It transforms unstructured real-world data (surveys, images, reports) into structured actionable insights and intelligently connects volunteers to tasks based on skills, availability, and location.

💡 “Turning data into action for maximum social impact.”


🎯 Problem Statement


Data is scattered across Excel, WhatsApp, paper forms


No structured prioritization of urgent needs


Manual volunteer assignment leads to inefficiency


Delayed response reduces real-world impact



💡 Solution – Sahayogam


📂 Converts raw data into structured insights (OCR + NLP + AI)


📊 Prioritizes tasks based on urgency & impact


🙋 Matches volunteers intelligently


🔔 Sends real-time notifications


🗺️ Provides heatmaps & dashboards



⚙️ Key Features
👨‍💼 NGO Side


Create & manage tasks


Upload data (OCR supported)


View analytics dashboard


Assign volunteers automatically


🙋 Volunteer Side


Register & login


View recommended tasks


Accept/Reject tasks


Track assigned work


Chat with NGOs


🤖 AI Features


OCR-based data extraction


AI classification (Gemini + logic)


Smart volunteer matching


Task prioritization engine



🏗️ System Architecture
Frontend (React + Vite)
        ↓
Backend (Node.js + Express)
        ↓
Firebase (Auth + Firestore)
        ↓
AI Layer (Gemini + OCR + NLP)
        ↓
Service Layer (Matching + Tasks + Notifications)

🔄 Workflow
Data Upload → OCR Processing → AI Analysis → Categorization
→ Priority Scoring → Task Creation → Volunteer Matching
→ Notification → Task Completion → Tracking

💻 Tech Stack
🌐 Frontend
React.js (Vite)
Tailwind CSS
Context API

🔙 Backend

Node.js + Express
🗄️ Database
Firebase Firestore
Firebase Authentication


🤖 AI / ML

Google Gemini API
OCR Service
NLP Processing


🔔 Notifications
Firebase Cloud Messaging



📁 Project Structure

🔙 Backend Structure
backend/
│── app.js
│
├── config/
│   ├── firebase.js
│   ├── index.js
│   ├── swagger.js
│
├── controllers/
│   ├── chatController.js
│   ├── dataCollectionController.js
│   ├── notificationController.js
│   ├── taskController.js
│   ├── taskRequestController.js
│   ├── uploadController.js
│   ├── userController.js
│
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│
├── models/
│   ├── Task.js
│   ├── User.js
│
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── dataRoutes.js
│   ├── notificationRoutes.js
│   ├── taskRequestRoutes.js
│   ├── taskRoutes.js
│   ├── uploadRoutes.js
│   ├── userRoutes.js
│   ├── volunteerRoutes.js
│
├── services/
│   ├── aiService.js
│   ├── authService.js
│   ├── geminiService.js
│   ├── notificationService.js
│   ├── ocrService.js
│   ├── parsingService.js
│   ├── taskRequestService.js
│   ├── taskService.js
│   ├── uploadService.js
│   ├── volunteerMatchingService.js
│
├── utils/
│   ├── helpers.js


---🎨 Frontend Structure
frontend/
│── index.html
│── package.json
│── vite.config.js
│── tailwind.config.js
│── postcss.config.js
│
├── public/
│   ├── logo.png
│
├── src/
│
│── App.jsx
│── main.jsx
│── index.css
│
├── config/
│   ├── firebase.js
│   ├── firebaseDebug.js
│
├── constants/
│   ├── categories.js
│
├── context/
│   ├── AuthContext.jsx
│   ├── ChatContext.jsx
│   ├── NotificationContext.jsx
│   ├── VolunteerContext.jsx
│
├── layouts/
│   ├── MainLayout.jsx
│   ├── SidebarLayout.jsx
│
├── pages/
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── NGODashboard.jsx
│   ├── VolunteerDashboard.jsx
│   ├── TaskManagement.jsx
│   ├── MyTasksPage.jsx
│   ├── MapPage.jsx
│   ├── ChatPage.jsx
│   ├── ProfilePage.jsx
│   ├── NGOProfilePage.jsx
│   ├── OCRProcessingPage.jsx
│
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── Sidebar.jsx
│   ├── VolunteerSidebar.jsx
│   ├── TaskCard.jsx
│   ├── MyTaskCard.jsx
│   ├── Heatmap.jsx
│   ├── MapView.jsx
│   ├── FilterBar.jsx
│   ├── NotificationBell.jsx
│   ├── LocationPicker.jsx
│
│   ├── OCR/
│   │   ├── OCRUpload.jsx
│   │   ├── OCRPreview.jsx
│   │   ├── OCRResult.jsx
│   │   ├── UploadCard.jsx
│
│   ├── Modals/
│   │   ├── AssignVolunteerModal.jsx
│   │   ├── EditTaskModal.jsx
│   │   ├── TaskDetailsModal.jsx
│   │   ├── TaskInvitationsModal.jsx
│   │   ├── AcceptedVolunteersModal.jsx
│
├── services/
│   ├── api.js
│
├── utils/
│   ├── stringUtils.js


🔐 Security
Firebase Authentication
JWT-based middleware
Role-based access control
Rate limiting protection



🌍 Future Scope

📱 Mobile App (Flutter / React Native)

🏛️ Government integration

🧠 Predictive AI for disaster management

🌐 Multi-language support

📡 Real-time crisis response system



🏆 Why Sahayogam?

✔ AI-powered automation

✔ Real-world social impact

✔ Scalable architecture

✔ End-to-end smart workflow

✔ Hackathon-ready full-stack system



👨‍💻 Developer Notes
Modular backend architecture
Scalable service-based design
Real-time communication support
AI + rule-based hybrid system
🤝 Contribution

Pull requests are welcome.
For major changes, please open an issue first.
```

