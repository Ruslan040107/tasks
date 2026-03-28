import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Games from './pages/Games';
import GamePage from './pages/GamePage';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/:slug" element={<GamePage />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile/:id" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
