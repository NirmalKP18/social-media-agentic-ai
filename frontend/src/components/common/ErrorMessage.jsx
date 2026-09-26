function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message" role="alert">
      <p className="error-message__text">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" className="error-message__retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorMessage