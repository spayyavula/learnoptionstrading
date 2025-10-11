import React from 'react'
import { Outlet } from 'react-router-dom'
import Layout from './Layout'
import { GamificationHUD, XPToastManager, LevelUpManager } from './gamification'

const AppLayout: React.FC = () => {
  return (
    <Layout>
      {/* Gamification Overlay Components */}
      <GamificationHUD position="top-right" showStreak={true} showRank={true} />
      <XPToastManager maxToasts={3} />
      <LevelUpManager />

      <Outlet />
    </Layout>
  )
}

export default AppLayout