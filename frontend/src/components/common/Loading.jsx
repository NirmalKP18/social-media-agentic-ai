function Loading({ label = 'Loading...' }) {
  return (
    <div className="loading">
      <span className="loading__spinner" aria-hidden="true" />
      <p className="loading__label">{label}</p>
    </div>
  )
}

export default Loading