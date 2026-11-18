export default function Loading() {
  return (
    <div className="container section" role="status" aria-label="Загрузка">
      <div className="skeleton skeleton-title" />
      <div className="product-grid">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton" key={n} />
        ))}
      </div>
    </div>
  );
}
