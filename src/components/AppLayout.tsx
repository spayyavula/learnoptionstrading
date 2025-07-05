import React from 'react'
import { Outlet } from 'react-router-dom'
import Layout from './Layout'

const AppLayout: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default AppLayout