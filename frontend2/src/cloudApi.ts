const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000'

export async function getTopScores(limit = 10){
  // json-server supports sorting and limiting with query params
  const res = await fetch(`${API_BASE}/scores?_sort=score&_order=desc&_limit=${limit}`)
  if(!res.ok) throw new Error('Failed to fetch scores')
  return res.json()
}

export async function saveScore(payload:{username:string,score:number}){
  const res = await fetch(`${API_BASE}/scores`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...payload, date: new Date().toISOString()})
  })
  if(!res.ok) throw new Error('Failed to save score')
  return res.json()
}
