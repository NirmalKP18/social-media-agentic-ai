import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <AppRoutes />
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App