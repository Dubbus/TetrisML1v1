import React from 'react'
import GameBoard from './gamedev/GameBoard'

export default function App(){
  return (
    <div className="app">
      <h1>TetrisML</h1>
      <p style={{color:'var(--muted)'}}></p>
      <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
        <GameBoard/>
      </div>
    </div>
  )
}
