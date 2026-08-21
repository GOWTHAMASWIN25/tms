import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  return (
    <div className="home-container">
      <section className="hero-section glass-card">
        <div className="hero-content">
          <h1 className="hero-title">
            Smart Infrastructure <br />
            <span>Management System</span>
          </h1>
          <p className="hero-description">
            Experience the next generation of ticket management. Efficeint, transparent, and seamless resolution for all your infrastructure needs.
          </p>

          <div className="hero-actions">
            <Link to="/complaints/new">
              <button className="hero-btn-primary">
                Raise a Ticket
              </button>
            </Link>
            {!isAuthenticated && (
              <Link to="/login">
                <button className="hero-btn-secondary btn-outline">
                  Partner Login
                </button>
              </Link>
            )}
            {isAuthenticated && (
              <Link to={user?.role === 'SuperAdmin' ? "/complaints" : "/my-complaints"}>
                <button className="hero-btn-secondary btn-outline">
                  View Dashboard
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <div className="glow-circle"></div>
          <div className="glow-circle-2"></div>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card glass">
          <h3>Rapid Resolution</h3>
          <p>Tickets are routed instantly to the right department for quick action.</p>
        </div>
        <div className="feature-card glass">
          <h3>Real-time Tracking</h3>
          <p>Monitor the status of your complaints with live updates and notifications.</p>
        </div>
        <div className="feature-card glass">
          <h3>Full Accountability</h3>
          <p>Complete transparent history of every ticket and resolution step.</p>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        .home-container {
          padding-top: 2rem;
        }
        .hero-section {
          display: flex;
          align-items: center;
          padding: 5rem;
          margin-bottom: 4rem;
          position: relative;
          overflow: hidden;
        }
        .hero-content {
          flex: 1;
          z-index: 1;
        }
        .hero-title {
          font-size: 4.5rem;
          line-height: 1.1;
          margin-bottom: 2rem;
          text-align: left;
        }
        .hero-title span {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-description {
          font-size: 1.25rem;
          color: var(--text-muted);
          max-width: 600px;
          margin-bottom: 3rem;
          line-height: 1.6;
        }
        .hero-actions {
          display: flex;
          gap: 1.5rem;
        }
        .hero-btn-primary {
          padding: 16px 32px;
          font-size: 1.1rem;
        }
        .hero-btn-secondary {
          padding: 16px 32px;
          font-size: 1.1rem;
        }
        .hero-visual {
          flex: 0.8;
          position: relative;
          height: 400px;
        }
        .glow-circle {
          position: absolute;
          top: 0;
          right: 0;
          width: 300px;
          height: 300px;
          background: var(--primary);
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          animation: float 6s infinite ease-in-out;
        }
        .glow-circle-2 {
          position: absolute;
          bottom: 0;
          left: 100px;
          width: 200px;
          height: 200px;
          background: var(--secondary);
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.2;
          animation: float 8s infinite ease-in-out reverse;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .feature-card {
          padding: 2.5rem;
        }
        .feature-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        .feature-card p {
          color: var(--text-muted);
          line-height: 1.6;
        }
        @media (max-width: 1024px) {
          .hero-section { padding: 3rem; flex-direction: column; text-align: center; }
          .hero-title { font-size: 3rem; text-align: center; }
          .hero-description { margin-inline: auto; }
          .hero-actions { justify-content: center; }
          .features-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </div>
  );
};

export default HomePage;
