import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import StudentLogin from './components/StudentLogin';
import StudentDashboard from './components/StudentDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [studentAuth, setStudentAuth] = useState(null);

  const handleLogin = (email) => {
    setAdminEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleStudentLogin = (user) => {
    setStudentAuth(user);
    setShowStudentLogin(false);
  };

  const handleStudentLogout = useCallback(() => {
    setStudentAuth(null);
  }, []);

  const openStudentLogin = useCallback(() => {
    if (!studentAuth) setShowStudentLogin(true);
  }, [studentAuth]);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        openStudentLogin();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openStudentLogin]);

  if (studentAuth) {
    return <StudentDashboard user={studentAuth} onLogout={handleStudentLogout} />;
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
      {showStudentLogin && (
        <StudentLogin
          defaultEmail={adminEmail}
          onLogin={handleStudentLogin}
          onClose={() => setShowStudentLogin(false)}
        />
      )}
    </>
  );
}

export default App;
