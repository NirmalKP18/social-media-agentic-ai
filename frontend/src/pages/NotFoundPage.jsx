import { Link } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import { ROUTES } from '../constants/routes.js'

function NotFoundPage() {
  return (
    <PageContainer
      title="404 - Page Not Found"
      subtitle="The page you are looking for does not exist."
    >
      <Link to={ROUTES.home}>Go back to Home</Link>
    </PageContainer>
  )
}

export default NotFoundPage