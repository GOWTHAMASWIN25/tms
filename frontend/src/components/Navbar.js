import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mastersDropdownOpen, setMastersDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMastersDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMastersDropdownOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;
  const isMasterActive = ['/departments', '/programmes', '/blocks', '/rooms', '/roles', '/users'].some(
    (p) => location.pathname.startsWith(p)
  );

  return (
    <header className="navbar-wrapper">
      <nav className="navbar glass">
        <div className="navbar-container">
          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </span>
            <span className="brand-text">
              TMS <span className="brand-sub">SmartDesk</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated ? (
            <div className="nav-links desktop-only">
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                Home
              </Link>

              {user?.role !== 'SuperAdmin' && (
                <Link
                  to="/my-complaints"
                  className={`nav-link ${isActive('/my-complaints') ? 'active' : ''}`}
                >
                  {user?.role === 'User' ? 'My Tickets' : 'My Assigned Tasks'}
                </Link>
              )}

              {user?.role === 'SuperAdmin' && (
                <>
                  <Link
                    to="/complaints"
                    className={`nav-link ${isActive('/complaints') ? 'active' : ''}`}
                  >
                    All Complaints
                  </Link>

                  <Link
                    to="/reports"
                    className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                  >
                    Analytics & Reports
                  </Link>

                  {/* Masters Dropdown */}
                  <div className="nav-dropdown" ref={dropdownRef}>
                    <button
                      type="button"
                      className={`nav-dropdown-btn ${isMasterActive ? 'active' : ''}`}
                      onClick={() => setMastersDropdownOpen(!mastersDropdownOpen)}
                    >
                      Master Directory
                      <span className={`dropdown-chevron ${mastersDropdownOpen ? 'open' : ''}`}>▾</span>
                    </button>

                    {mastersDropdownOpen && (
                      <div className="dropdown-menu glass-card">
                        <Link to="/departments" className="dropdown-item">
                          <span>🏢 Departments</span>
                        </Link>
                        <Link to="/programmes" className="dropdown-item">
                          <span>🎓 Programmes</span>
                        </Link>
                        <Link to="/blocks" className="dropdown-item">
                          <span>🏛 Blocks</span>
                        </Link>
                        <Link to="/rooms" className="dropdown-item">
                          <span>🚪 Rooms</span>
                        </Link>
                        <Link to="/roles" className="dropdown-item">
                          <span>🛡 Roles</span>
                        </Link>
                        <Link to="/users" className="dropdown-item">
                          <span>👥 Users</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}

              {(!user?.role || ['SuperAdmin', 'User'].includes(user?.role)) && (
                <Link to="/complaints/new" className="nav-btn-highlight">
                  <span>+</span> Raise Ticket
                </Link>
              )}
            </div>
          ) : (
            <div className="nav-links desktop-only">
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                Home
              </Link>
              <Link to="/login" className="nav-btn-highlight">
                Sign In
              </Link>
            </div>
          )}

          {/* User Profile Capsule & Hamburger */}
          <div className="nav-actions">
            {isAuthenticated ? (
              <div className="user-capsule desktop-only">
                <div className="user-avatar">
                  {(user?.username || 'U')[0].toUpperCase()}
                </div>
                <div className="user-meta">
                  <span className="user-name">{user?.username}</span>
                  <span className="user-role-badge">{user?.role || 'User'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="nav-logout-btn"
                  title="Sign Out"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            ) : null}

            {/* Mobile Hamburger Toggle */}
            <button
              className="hamburger-btn mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer glass-card">
            {isAuthenticated ? (
              <div className="mobile-nav-list">
                <div className="mobile-user-info">
                  <div className="user-avatar">
                    {(user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name">{user?.username}</div>
                    <div className="user-role-badge">{user?.role}</div>
                  </div>
                </div>

                <Link to="/" className="mobile-nav-link">
                  🏠 Home
                </Link>

                {(!user?.role || ['SuperAdmin', 'User'].includes(user?.role)) && (
                  <Link to="/complaints/new" className="mobile-nav-link highlight">
                    ➕ Raise Ticket
                  </Link>
                )}

                {user?.role !== 'SuperAdmin' && (
                  <Link to="/my-complaints" className="mobile-nav-link">
                    📋 {user?.role === 'User' ? 'My Tickets' : 'My Tasks'}
                  </Link>
                )}

                {user?.role === 'SuperAdmin' && (
                  <>
                    <Link to="/complaints" className="mobile-nav-link">
                      🗂 All Complaints
                    </Link>
                    <Link to="/reports" className="mobile-nav-link">
                      📊 Reports & Analytics
                    </Link>

                    <div className="mobile-category-title">Master Directory</div>
                    <div className="mobile-subgrid">
                      <Link to="/departments" className="mobile-sublink">🏢 Departments</Link>
                      <Link to="/programmes" className="mobile-sublink">🎓 Programmes</Link>
                      <Link to="/blocks" className="mobile-sublink">🏛 Blocks</Link>
                      <Link to="/rooms" className="mobile-sublink">🚪 Rooms</Link>
                      <Link to="/roles" className="mobile-sublink">🛡 Roles</Link>
                      <Link to="/users" className="mobile-sublink">👥 Users</Link>
                    </div>
                  </>
                )}

                <button onClick={handleLogout} className="mobile-logout-btn">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-nav-list">
                <Link to="/" className="mobile-nav-link">🏠 Home</Link>
                <Link to="/login" className="mobile-nav-link highlight">🔐 Sign In</Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
