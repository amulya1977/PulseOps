const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export async function api(path, options={}) {
  const token = localStorage.getItem('pulseops_token');
  const headers = { 'Content-Type':'application/json', ...(options.headers||{}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export { BASE };
