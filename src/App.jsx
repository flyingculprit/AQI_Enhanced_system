import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AQIDashboard from './pages/AQIDashboard';
import LiveDashboard from './pages/LiveDashboard';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Setup from './pages/Setup';
import ProtectedRoute from './components/ProtectedRoute';

function Navigation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-gray-800 shadow-md border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-white">
            AQI Dashboard
          </Link>
          <div className="space-x-4 flex items-center">
            <Link
              to="/"
              className="text-gray-300 hover:text-blue-400 transition-colors"
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  to="/aqi"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/live"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2 font-medium"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Live
                </Link>
                <span className="text-gray-300">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Navigation />
      <Routes>
        <Route
          path="/"
          element={
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-bold text-white mb-8">
                  Welcome to AQI App
                </h1>
                <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8 border border-gray-700">
                  <p className="text-gray-300 mb-6">
                    Monitor air quality and weather data for cities around the world.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link
                      to="/aqi"
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/setup" element={<Setup />} />
        <Route
          path="/aqi"
          element={
            <ProtectedRoute>
              <AQIDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live"
          element={
            <ProtectedRoute>
              <LiveDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

