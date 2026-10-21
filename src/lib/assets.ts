export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

export function photo(id: string, width = 1200): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
}
