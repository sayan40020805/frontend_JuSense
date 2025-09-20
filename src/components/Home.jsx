import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Quick Polls App</h1>
          <p className="hero-subtitle">
            Create polls, share with friends, and see results update in real-time!
          </p>
          <div className="hero-buttons">
            {!isAuthenticated ? (
              <>
                <Link to="/signup" className="hero-button primary">
                  Get Started
                </Link>
                <Link to="/login" className="hero-button secondary">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link to="/polls" className="hero-button primary">
                  My Polls
                </Link>
                <Link to="/create-poll" className="hero-button secondary">
                  Create Poll
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Create Polls</h3>
              <p>Create engaging polls with multiple options and share them instantly</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Updates</h3>
              <p>See results update live as people vote using WebSocket technology</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Easy Sharing</h3>
              <p>Share poll links with anyone - no login required to vote</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Works perfectly on desktop, tablet, and mobile devices</p>
            </div>
          </div>
        </div>
      </div>

      <div className="about-section">
        <div className="container">
          <h2 className="section-title">About This Project</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                This Quick Polls application was built as a full-stack web application
                to demonstrate modern web development practices. It features real-time
                updates, secure authentication, and a responsive user interface.
              </p>
              <p>
                <strong>Technologies Used:</strong>
              </p>
              <ul>
                <li><strong>Frontend:</strong> React.js, React Router, Axios</li>
                <li><strong>Backend:</strong> Node.js, Express.js, Socket.io</li>
                <li><strong>Database:</strong> MongoDB with Mongoose ODM</li>
                <li><strong>Authentication:</strong> JWT (JSON Web Tokens)</li>
                <li><strong>Real-time:</strong> WebSocket with Socket.io</li>
                <li><strong>Styling:</strong> CSS3 with modern animations</li>
              </ul>
            </div>
            <div className="about-stats">
              <div className="stat-item">
                <div className="stat-number">⚡</div>
                <div className="stat-label">Real-time</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">🔒</div>
                <div className="stat-label">Secure</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">📱</div>
                <div className="stat-label">Responsive</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
