import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  const categories = [
    { name: 'PC Hardware', icon: '💻', desc: 'Desktops, monitors, printers, mice & keyboards' },
    { name: 'Network & Wi-Fi', icon: '🌐', desc: 'LAN ports, campus Wi-Fi, switches & routers' },
    { name: 'Electronics & Audio', icon: '⚡', desc: 'Projectors, PA systems, power points, smart boards' },
    { name: 'Plumbing & Facilities', icon: '🛠', desc: 'Water supply, air conditioning, lab furnishings' },
  ];

  return (
    <div className="home-container fade-in">
      {/* Hero Section */}
      <section className="hero-card glass-card">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            <span>Intelligent Campus Dispatch System</span>
          </div>

          <h1 className="hero-title">
            Next-Gen Infrastructure <br />
            <span className="gradient-text">& Ticket Resolution Hub</span>
          </h1>

          <p className="hero-description">
            Report hardware, software, network, and facility issues in seconds. Enjoy instant routing to designated technicians, real-time tracking, and full resolution transparency.
          </p>

          <div className="hero-actions">
            <Link to="/complaints/new" className="btn btn-primary hero-btn">
              <span>⚡</span> Raise a Ticket Now
            </Link>

            {isAuthenticated ? (
              <Link
                to={user?.role === 'SuperAdmin' ? '/complaints' : '/my-complaints'}
                className="btn btn-secondary hero-btn"
              >
                <span>📊</span> Go to Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary hero-btn">
                <span>🔐</span> Staff & Student Sign In
              </Link>
            )}

            {user?.role === 'SuperAdmin' && (
              <Link to="/reports" className="btn btn-outline hero-btn">
                <span>📈</span> View Analytics
              </Link>
            )}
          </div>
        </div>

        {/* Ambient Decorative Graphic */}
        <div className="hero-visual">
          <div className="ambient-orb orb-primary"></div>
          <div className="ambient-orb orb-accent"></div>
          <div className="hero-glass-badge glass">
            <div className="hgb-header">
              <span className="hgb-dot green"></span>
              <span>Campus Incident Dispatch Active</span>
            </div>
            <div className="hgb-stats">
              <div className="hgb-stat">
                <span className="hgb-num">45 min</span>
                <span className="hgb-lbl">Avg Response</span>
              </div>
              <div className="hgb-divider"></div>
              <div className="hgb-stat">
                <span className="hgb-num">99.2%</span>
                <span className="hgb-lbl">Resolution Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Metrics Counter Strip */}
      <section className="metrics-strip">
        <div className="metric-box glass">
          <div className="metric-value">99.4%</div>
          <div className="metric-label">Resolution SLA</div>
          <div className="metric-sub">Across all campus departments</div>
        </div>
        <div className="metric-box glass">
          <div className="metric-value">&lt; 45m</div>
          <div className="metric-label">Rapid Dispatch</div>
          <div className="metric-sub">Dedicated technician triage</div>
        </div>
        <div className="metric-box glass">
          <div className="metric-value">100%</div>
          <div className="metric-label">Audit Logged</div>
          <div className="metric-sub">Real-time status history</div>
        </div>
        <div className="metric-box glass">
          <div className="metric-value">4.9 ★</div>
          <div className="metric-label">User Satisfaction</div>
          <div className="metric-sub">Student & faculty reviews</div>
        </div>
      </section>

      {/* Quick Category Launchers */}
      <section className="category-section">
        <div className="section-header">
          <h2>Select a Problem Category</h2>
          <p className="text-muted">Directly launch a support ticket for campus services</p>
        </div>

        <div className="category-grid">
          {categories.map((cat, idx) => (
            <Link to="/complaints/new" key={idx} className="category-card glass-card">
              <div className="category-icon">{cat.icon}</div>
              <h3 className="category-name">{cat.name}</h3>
              <p className="category-desc">{cat.desc}</p>
              <span className="category-link">Raise Request →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Core Platform Highlights */}
      <section className="features-section">
        <div className="section-header">
          <h2>Engineered For Campus Excellence</h2>
          <p className="text-muted">Built from the ground up for speed, reliability, and full accountability</p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon-badge">⚡</div>
            <h3>Smart Department Routing</h3>
            <p>Complaints automatically link to the corresponding block, room, and department staff with zero manual delays.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-badge">🎯</div>
            <h3>Priority & SLA Control</h3>
            <p>Urgent tags ensure exam halls, server rooms, and critical lecture theatres receive emergency resolution.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-badge">📷</div>
            <h3>Media Attachments</h3>
            <p>Upload screenshots and physical photos of broken hardware for faster diagnostic assessments.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-badge">🌟</div>
            <h3>Feedback & Star Ratings</h3>
            <p>Users verify resolution quality with 1-5 star ratings and reviews once work orders are completed.</p>
          </div>
        </div>
      </section>

      {/* Support Banner */}
      <section className="support-banner glass-card">
        <div className="sb-content">
          <h3>Need Emergency Assistance?</h3>
          <p>Campus IT & Facilities Control Room is manned 24/7. Intercom Ext: 4400 / 4401.</p>
        </div>
        <Link to="/complaints/new" className="btn btn-primary">
          Create Emergency Ticket
        </Link>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        .home-container {
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        .hero-card {
          padding: 4.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 3rem;
          background: linear-gradient(135deg, rgba(20, 29, 53, 0.9) 0%, rgba(13, 20, 36, 0.95) 100%);
          position: relative;
          border-radius: 28px;
        }

        .hero-content {
          flex: 1.2;
          z-index: 2;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #a5b4fc;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulseGreen 1.5s infinite;
        }

        @keyframes pulseGreen {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 1.5rem;
        }

        .hero-description {
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 620px;
          margin-bottom: 2.5rem;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .hero-btn {
          padding: 13px 26px;
          font-size: 0.98rem;
          border-radius: 14px;
        }

        .hero-visual {
          flex: 0.8;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 280px;
        }

        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.45;
          pointer-events: none;
        }

        .orb-primary {
          width: 260px;
          height: 260px;
          background: #6366f1;
          top: 10px;
          right: 20px;
        }

        .orb-accent {
          width: 200px;
          height: 200px;
          background: #06b6d4;
          bottom: 20px;
          left: 30px;
        }

        .hero-glass-badge {
          position: relative;
          z-index: 2;
          padding: 1.75rem 2rem;
          border-radius: 20px;
          background: rgba(18, 25, 46, 0.7);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .hgb-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 1.25rem;
        }

        .hgb-dot.green {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .hgb-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .hgb-stat {
          display: flex;
          flex-direction: column;
        }

        .hgb-num {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
          line-height: 1.1;
        }

        .hgb-lbl {
          font-size: 0.78rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .hgb-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Metrics Strip */
        .metrics-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .metric-box {
          padding: 1.8rem 2rem;
          border-radius: 20px;
          background: rgba(18, 25, 44, 0.6);
          transition: var(--transition);
        }

        .metric-box:hover {
          transform: translateY(-4px);
          border-color: rgba(99, 102, 241, 0.35);
        }

        .metric-value {
          font-family: var(--font-heading);
          font-size: 2.4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .metric-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
        }

        .metric-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* Section Headers */
        .section-header {
          text-align: left;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        /* Categories Grid */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }

        .category-card {
          padding: 2.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          text-decoration: none;
          color: inherit;
        }

        .category-icon {
          font-size: 2.4rem;
          margin-bottom: 0.5rem;
        }

        .category-name {
          font-size: 1.25rem;
          color: white;
          margin: 0;
        }

        .category-desc {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.5;
          flex: 1;
        }

        .category-link {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--primary-light);
          margin-top: 0.5rem;
        }

        /* Features Grid */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }

        .feature-card {
          padding: 2.2rem;
        }

        .feature-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          margin-bottom: 1.25rem;
        }

        .feature-card h3 {
          font-size: 1.2rem;
          color: white;
          margin-bottom: 0.75rem;
        }

        .feature-card p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.55;
        }

        /* Support Banner */
        .support-banner {
          padding: 2.5rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          background: linear-gradient(135deg, rgba(30, 41, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
          border-radius: 24px;
        }

        .sb-content h3 {
          font-size: 1.45rem;
          margin-bottom: 0.4rem;
        }

        .sb-content p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        @media (max-width: 1024px) {
          .hero-card {
            flex-direction: column;
            padding: 3rem 2rem;
            text-align: center;
          }
          .hero-badge {
            margin-inline: auto;
          }
          .hero-title {
            font-size: 2.75rem;
          }
          .hero-description {
            margin-inline: auto;
          }
          .hero-actions {
            justify-content: center;
          }
          .support-banner {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 2.2rem;
          }
          .hero-btn {
            width: 100%;
          }
        }
      `}} />
    </div>
  );
};

export default HomePage;
