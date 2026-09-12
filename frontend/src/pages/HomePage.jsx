import HealthCheck from '../components/HealthCheck.jsx'

function HomePage() {
  return (
    <main className="home">
      <header className="home__header">
        <h1>Social Media Agentic AI</h1>
        <p>React frontend foundation - Vite + JavaScript</p>
      </header>

      <section className="home__section">
        <h2>Backend Connection Check</h2>
        <HealthCheck />
      </section>
    </main>
  )
}

export default HomePage