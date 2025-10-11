import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import SeoHelmet from './components/SeoHelmet'
import ErrorBoundary from './components/ErrorBoundary'
import ChunkErrorBoundary from './components/ChunkErrorBoundary'
import Disclaimer from './components/Disclaimer'
import ErrorDisplay from './components/ErrorDisplay'
import Landing from './pages/Landing'
import AdminRoute from './components/AdminRoute'
import { AuthProvider } from './components/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import { OptionsProvider } from './context/OptionsContext'
import { TradingProvider } from './context/TradingContext'
import { OptionsDataProvider } from './context/OptionsDataContext'
import SubscriptionPage from './pages/SubscriptionPage'
import Success from './pages/Success'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import OptionsChain from './pages/OptionsChain'
import EnhancedTrading from './components/EnhancedTrading'
import ComingSoon from './pages/ComingSoon'
import lazyWithRetry from './utils/lazyWithRetry'

// Lazy load page components with retry logic
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'))
const AgentDashboard = lazyWithRetry(() => import('./pages/AgentDashboard'))
const Demo = lazyWithRetry(() => import('./pages/Demo'))
const OptionsPortfolio = lazyWithRetry(() => import('./pages/OptionsPortfolio'))
const OptionsTrading = lazyWithRetry(() => import('./pages/OptionsTrading'))
const Orders = lazyWithRetry(() => import('./pages/Orders'))
const RegimeAnalysis = lazyWithRetry(() => import('./pages/RegimeAnalysis'))
const Analytics = lazyWithRetry(() => import('./pages/Analytics'))
const OptionsArbitrage = lazyWithRetry(() => import('./pages/OptionsArbitrage'))
const OptionsLearning = lazyWithRetry(() => import('./pages/OptionsLearning'))
const TradingJournal = lazyWithRetry(() => import('./pages/TradingJournal'))
const OptionsStrategies = lazyWithRetry(() => import('./pages/OptionsStrategies'))
const StrategyTemplates = lazyWithRetry(() => import('./pages/StrategyTemplates'))
const Community = lazyWithRetry(() => import('./pages/Community'))
const Settings = lazyWithRetry(() => import('./pages/Settings'))
const OptionsDataManager = lazyWithRetry(() => import('./pages/OptionsDataManager'))
const Construction = lazyWithRetry(() => import('./pages/Construction'))
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'))
const ConfigManager = lazyWithRetry(() => import('./pages/ConfigManager'))
const UserProfile = lazyWithRetry(() => import('./pages/UserProfile'))
const NotFound = lazyWithRetry(() => import('./pages/NotFound'))
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'))
const TermsAndConditions = lazyWithRetry(() => import('./pages/TermsAndConditions'))
const DisclaimerDetailed = lazyWithRetry(() => import('./pages/DisclaimerDetailed'))
const EventOptionsAnalysis = lazyWithRetry(() => import('./pages/EventOptionsAnalysis'))
const SentimentAnalysis = lazyWithRetry(() => import('./pages/SentimentAnalysis'))
const OptionsScreener = lazyWithRetry(() => import('./pages/OptionsScreener'))
const LiquidOptionsSentimentHeatMap = lazyWithRetry(() => import('./pages/LiquidOptionsSentimentHeatMap'))
const BrokerConnections = lazyWithRetry(() => import('./pages/BrokerConnections'))

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

function RequireLandingVisit({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const hasVisitedLanding = localStorage.getItem('hasVisitedLanding') === 'true'

  // Always allow landing page
  if (location.pathname === '/') {
    return <>{children}</>
  }

  // If not visited landing, redirect to landing
  if (!hasVisitedLanding) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  // If user tries to access /optionschain, redirect to /app/optionschain
  if (location.pathname === '/optionschain') {
    return <Navigate to="/app/optionschain" replace />
  }

  // Otherwise, allow access
  return <>{children}</>
}

function App() {
  return (
    <ChunkErrorBoundary>
      <AuthProvider>
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
      </AuthProvider>
    </ChunkErrorBoundary>
  )
}

// Separate component to use useLocation hook
function AppContent() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'

  useEffect(() => {
    if (isLandingPage) {
      localStorage.setItem('hasVisitedLanding', 'true')
    }
  }, [isLandingPage])

  return (
    <div className="App min-h-screen flex flex-col">
      {/* Show disclaimer only on app pages, not landing */}
      {!isLandingPage && <Disclaimer variant="banner" />}
      {import.meta.env.DEV && <ErrorDisplay />}
      <div className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <RequireLandingVisit>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/optionschain" element={<OptionsChain />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/success" element={<Success />} />
              <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
              <Route path="/TermsAndConditions" element={<TermsAndConditions />} />
              <Route path="/DisclaimerDetailed" element={<DisclaimerDetailed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Login />} />

              {/* App Routes with nested routing */}
              <Route path="/app" element={
                <AppLayout />
              }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="agent" element={<AgentDashboard />} />
                <Route path="demo" element={<Demo />} />
                <Route path="portfolio" element={<OptionsPortfolio />} />
                <Route path="trading" element={<EnhancedTrading />} />
                <Route path="orders" element={<Orders />} />
                <Route path="optionschain" element={<OptionsChain />} />
                <Route path="regime" element={<RegimeAnalysis />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="arbitrage" element={<OptionsArbitrage />} />
                <Route path="learning" element={<OptionsLearning />} />
                <Route path="journal" element={<TradingJournal />} />
                <Route path="strategies" element={<OptionsStrategies />} />
                <Route path="templates" element={<StrategyTemplates />} />
                <Route path="community" element={<Community />} />
                <Route path="settings" element={<Settings />} />
                <Route path="data" element={<OptionsDataManager />} />
                <Route path="construction" element={<Construction />} />
                <Route path="subscription" element={<SubscriptionPage />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="events" element={<EventOptionsAnalysis />} />
                <Route path="sentiment" element={<SentimentAnalysis />} />
                <Route path="screener" element={<OptionsScreener />} />
                <Route path="sentiment-heatmap" element={<LiquidOptionsSentimentHeatMap />} />
                <Route path="brokers" element={<BrokerConnections />} />
                {/* Admin Routes */}
                <Route path="admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="config" element={
                  <AdminRoute>
                    <ConfigManager />
                  </AdminRoute>
                } />
                <Route path="/app/option-chain" element={<OptionsChain />} />
                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </RequireLandingVisit>
        </Suspense>
      </div>
    </div>
  )
}

export default App;
