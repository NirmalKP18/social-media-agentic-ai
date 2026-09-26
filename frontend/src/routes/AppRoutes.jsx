import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import HomePage from '../pages/HomePage.jsx'
import LivePreviewPage from '../pages/LivePreviewPage.jsx'
import UseCasesPage from '../pages/UseCasesPage.jsx'
import CapabilitiesPage from '../pages/CapabilitiesPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import PostsPage from '../pages/PostsPage.jsx'
import PostDetailPage from '../pages/PostDetailPage.jsx'
import AnalysesPage from '../pages/AnalysesPage.jsx'
import RetrievalPage from '../pages/RetrievalPage.jsx'
import RetrievalDetailPage from '../pages/RetrievalDetailPage.jsx'
import InsightsPage from '../pages/InsightsPage.jsx'
import InsightDetailPage from '../pages/InsightDetailPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import AlertsPage from '../pages/AlertsPage.jsx'
import ConnectionsPage from '../pages/ConnectionsPage.jsx'
import KnowledgeBasePage from '../pages/KnowledgeBasePage.jsx'
import AgentLogsPage from '../pages/AgentLogsPage.jsx'
import SettingsPage from '../pages/SettingsPage.jsx'
import AgentWorkflowPage from '../pages/AgentWorkflowPage.jsx'
import EvaluationPage from '../pages/EvaluationPage.jsx'
import AdminPanelPage from '../pages/AdminPanelPage.jsx'
import BrandsPage from '../pages/BrandsPage.jsx'
import BrandDetailPage from '../pages/BrandDetailPage.jsx'
import SubscriptionPage from '../pages/SubscriptionPage.jsx'
import CheckoutPage from '../pages/CheckoutPage.jsx'
import PipelineHistoryPage from '../pages/PipelineHistoryPage.jsx'
import ProtectedRoute, { AdminRoute } from './ProtectedRoute.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/preview" element={<LivePreviewPage />} />
        <Route path="/use-cases" element={<UseCasesPage />} />
        <Route path="/capabilities" element={<CapabilitiesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brands"
          element={
            <ProtectedRoute>
              <BrandsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brands/:id"
          element={
            <ProtectedRoute>
              <BrandDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pipeline-history"
          element={
            <ProtectedRoute>
              <PipelineHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts"
          element={
            <ProtectedRoute>
              <PostsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <ProtectedRoute>
              <PostDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyses"
          element={
            <ProtectedRoute>
              <AnalysesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retrieval"
          element={
            <ProtectedRoute>
              <RetrievalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retrieval/:id"
          element={
            <ProtectedRoute>
              <RetrievalDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connections"
          element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>}
        />
        <Route
          path="/alerts"
          element={<ProtectedRoute><AlertsPage /></ProtectedRoute>}
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <InsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights/:id"
          element={
            <ProtectedRoute>
              <InsightDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/knowledge"
          element={
            <AdminRoute>
              <KnowledgeBasePage />
            </AdminRoute>
          }
        />
        <Route
          path="/agent-logs"
          element={
            <AdminRoute>
              <AgentLogsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanelPage />
            </AdminRoute>
          }
        />
        <Route
          path="/agent-workflow"
          element={<ProtectedRoute><AgentWorkflowPage /></ProtectedRoute>}
        />
        <Route
          path="/evaluation"
          element={<ProtectedRoute><EvaluationPage /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
