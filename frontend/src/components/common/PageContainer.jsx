function PageContainer({ title, subtitle, children }) {
  return (
    <section className="page">
      {(title || subtitle) && (
        <header className="page__header">
          {title && <h1 className="page__title">{title}</h1>}
          {subtitle && <p className="page__subtitle">{subtitle}</p>}
        </header>
      )}
      <div className="page__content">{children}</div>
    </section>
  )
}

export default PageContainer