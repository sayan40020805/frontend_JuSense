import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/polls" className="nav-logo">
          Quick Polls
        </Link>
        <div className="nav-menu">
          {user ? (
            <>
              <Link to="/polls" className="nav-link">
                My Polls
              </Link>
              <Link to="/create-poll" className="nav-link">
                Create Poll
              </Link>


              <span className="nav-user">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="nav-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/signup" className="nav-link">
                Sign Up
              </Link>

            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
