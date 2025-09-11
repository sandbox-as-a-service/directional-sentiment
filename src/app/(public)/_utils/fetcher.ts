export async function fetcher(url: string, init?: RequestInit) {
  const res = await fetch(url, init)

  if (!res.ok) {
    throw new Error("fetch_error")
  }

  return await res.json()
}
