import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import SeoHelmet from './components/SeoHelmet'
import ErrorBoundary from './components/ErrorBoundary'
import Disclaimer from './components/Disclaimer'
import ErrorDisplay from './components/ErrorDisplay'
import Landing from './pages/Landing'
import AdminRoute from './components/AdminRoute'
import { OptionsProvider } from './context/OptionsContext'
import { TradingProvider } from './context/TradingContext'
import { OptionsDataProvider } from './context/OptionsDataContext'
import SubscriptionPage from './pages/SubscriptionPage'
import Success from './pages/Success'
import AppLayout from './components/AppLayout'
import { auth } from './firebase';
import PrivateRoute from './components/PrivateRoute';

// Lazy load page components
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'))
const Demo = lazy(() => import('./pages/Demo'))
const OptionsPortfolio = lazy(() => import('./pages/OptionsPortfolio'))
const OptionsTrading = lazy(() => import('./pages/OptionsTrading'))
const Orders = lazy(() => import('./pages/Orders'))
const OptionsChain = lazy(() => import('./pages/OptionsChain'))
const RegimeAnalysis = lazy(() => import('./pages/RegimeAnalysis'))
const Analytics = lazy(() => import('./pages/Analytics'))
const OptionsArbitrage = lazy(() => import('./pages/OptionsArbitrage'))
const OptionsLearning = lazy(() => import('./pages/OptionsLearning'))
const TradingJournal = lazy(() => import('./pages/TradingJournal'))
const OptionsStrategies = lazy(() => import('./pages/OptionsStrategies'))
const Community = lazy(() => import('./pages/Community'))
const Settings = lazy(() => import('./pages/Settings'))
const OptionsDataManager = lazy(() => import('./pages/OptionsDataManager'))
const Construction = lazy(() => import('./pages/Construction'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const NotFound = lazy(() => import('./pages/NotFound')) // Import the NotFound component
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'))
const DisclaimerDetailed = lazy(() => import('./pages/DisclaimerDetailed'))
const Login = lazy(() => import('./pages/loginSignup')) // Import the Login component

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

function App() {
  return (
    <TradingProvider>
      <ErrorBoundary>
        <OptionsProvider>
          <OptionsDataProvider>
            <Router>
              <SeoHelmet />
              <AppContent />
            </Router>
          </OptionsDataProvider>
        </OptionsProvider>
      </ErrorBoundary>
    </TradingProvider>
  )
}

// Separate component to use useLocation hook
function AppContent() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'

  return (
    <div className="App min-h-screen flex flex-col">
      {/* Show disclaimer only on app pages, not landing */}
      {!isLandingPage && <Disclaimer variant="banner" />}
      
      {/* Dev error display */}
      {import.meta.env.DEV && <ErrorDisplay />}
      
      {/* Main content area */}
      <div className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/success" element={<Success />} />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/TermsAndConditions" element={<TermsAndConditions />} />
            <Route path="/DisclaimerDetailed" element={<DisclaimerDetailed />} />
            <Route path="/login" element={<Login />} />
            
            {/* App Routes with nested routing */}
            <Route path="/app" element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="agent" element={<AgentDashboard />} />
              <Route path="demo" element={<Demo />} />
              <Route path="portfolio" element={<OptionsPortfolio />} />
              <Route path="trading" element={<OptionsTrading />} />
              <Route path="orders" element={<Orders />} />
              <Route path="chain" element={<OptionsChain />} />
              <Route path="regime" element={<RegimeAnalysis />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="arbitrage" element={<OptionsArbitrage />} />
              <Route path="learning" element={<OptionsLearning />} />
              <Route path="journal" element={<TradingJournal />} />
              <Route path="strategies" element={<OptionsStrategies />} />
              <Route path="community" element={<Community />} />
              <Route path="settings" element={<Settings />} />
              <Route path="data" element={<OptionsDataManager />} />
              <Route path="construction" element={<Construction />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="profile" element={<UserProfile />} />
              
              {/* Admin Routes */}
              <Route path="admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
            </Route>
            
            {/* Catch-all redirect */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}

export default App