import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import TeamManagement from './pages/Admin/TeamManagement';
import TaskManagement from './pages/Admin/TaskManagement';
import ResourceManagement from './pages/Admin/ResourceManagement';
import ExamManagement from './pages/Admin/ExamManagement';
import UserManagement from './pages/Admin/UserManagement';
import ProgressTracking from './pages/Admin/ProgressTracking';

// Intern Pages
import InternDashboard from './pages/Intern/Dashboard';
import MyTasks from './pages/Intern/MyTasks';
import Resources from './pages/Intern/Resources';
import TakeExam from './pages/Intern/TakeExam';
import MyProgress from './pages/Intern/MyProgress';

// Set axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="teams" element={<TeamManagement />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="resources" element={<ResourceManagement />} />
              <Route path="exams" element={<ExamManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="progress" element={<ProgressTracking />} />
            </Route>

            {/* Intern Routes */}
            <Route path="/intern" element={<PrivateRoute role="intern"><InternLayout /></PrivateRoute>}>
              <Route index element={<InternDashboard />} />
              <Route path="tasks" element={<MyTasks />} />
              <Route path="resources" element={<Resources />} />
              <Route path="exam/:id" element={<TakeExam />} />
              <Route path="progress" element={<MyProgress />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Private Route Component
function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (role && userRole !== role) {
    return <Navigate to={`/${userRole}`} />;
  }

  return children;
}

// Admin Layout
function AdminLayout() {
  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row">
          <AdminSidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="teams" element={<TeamManagement />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="resources" element={<ResourceManagement />} />
              <Route path="exams" element={<ExamManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="progress" element={<ProgressTracking />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

// Intern Layout
function InternLayout() {
  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row">
          <InternSidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <Routes>
              <Route index element={<InternDashboard />} />
              <Route path="tasks" element={<MyTasks />} />
              <Route path="resources" element={<Resources />} />
              <Route path="exam/:id" element={<TakeExam />} />
              <Route path="progress" element={<MyProgress />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

// Admin Sidebar
function AdminSidebar() {
  return (
    <nav className="col-md-3 col-lg-2 d-md-block sidebar">
      <div className="position-sticky pt-3">
        <ul className="nav flex-column">
          <li className="nav-item">
            <a className="nav-link" href="/admin">
              Dashboard
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/teams">
              Teams
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/users">
              Users
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/tasks">
              Tasks
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/resources">
              Resources
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/exams">
              Exams
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/progress">
              Progress Tracking
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

// Intern Sidebar
function InternSidebar() {
  return (
    <nav className="col-md-3 col-lg-2 d-md-block sidebar">
      <div className="position-sticky pt-3">
        <ul className="nav flex-column">
          <li className="nav-item">
            <a className="nav-link" href="/intern">
              Dashboard
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/intern/tasks">
              My Tasks
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/intern/resources">
              Resources
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/intern/progress">
              My Progress
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default App;
