import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import OTPVerify from './pages/OTPVerify/OTPVerify';
import ChatPage from './pages/Chat/ChatPage';
import InvitePage from './pages/Invite/InvitePage';
import ProtectedRoute from './components/common/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <ChatProvider>
                    <ChatPage />
                  </ChatProvider>
                </SocketProvider>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Mobile hint */}
        <div className="mobile-hint">
          <h2>📱 Desktop Required</h2>
          <p>WhatsApp Web requires a screen width of at least 768px. Please open on a desktop browser.</p>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
