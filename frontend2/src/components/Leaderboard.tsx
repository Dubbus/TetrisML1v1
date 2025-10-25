import React, { useEffect, useState } from 'react'
import { getTopScores } from '../cloudApi'

export default function Leaderboard(){
  const [scores, setScores] = useState<Array<{id?:number,username:string,score:number,date?:string}>>([])
  const [loading, setLoading] = useState(false)

  async function load(){
    setLoading(true)
    try{
      const data = await getTopScores(10)
      setScores(data)
    }catch(e){
      console.error(e)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ load() },[])

  return (
    <div style={{marginTop:16}}>
      <h3>Top Scores</h3>
      {loading ? <p>Loading…</p> : (
        <ol>
          {scores.map(s=> (
            <li key={s.id ?? `${s.username}-${s.score}-${s.date}`}>{s.username} — {s.score}</li>
          ))}
        </ol>
      )}
      <button onClick={load}>Refresh</button>
    </div>
  )
}
