import React, { useEffect, useRef, useState } from 'react'
import { SHAPES, COLORS } from './TetrominoConstants'
import { rotate, randomTetromino } from './TetrominoLogic'

const COLS = 10
const ROWS = 20
const CELL = 24

type Piece = { key:string, shape:number[][], x:number, y:number }

function makeEmptyGrid(){
  return Array.from({length:ROWS}, ()=>Array(COLS).fill(0))
}

function collide(grid:any[][], piece:Piece){
  const {shape,x,y} = piece
  for(let r=0;r<shape.length;r++){
    for(let c=0;c<shape[r].length;c++){
      if(shape[r][c]){
        const gx = x + c
        const gy = y + r
        if(gx<0 || gx>=COLS || gy>=ROWS) return true
        if(gy>=0 && grid[gy][gx]) return true
      }
    }
  }
  return false
}

function lockPieceToGrid(grid:any[][], piece:Piece){
  const newGrid = grid.map(r=>r.slice())
  for(let r=0;r<piece.shape.length;r++){
    for(let c=0;c<piece.shape[r].length;c++){
      if(piece.shape[r][c]){
        const gx = piece.x + c
        const gy = piece.y + r
        if(gy>=0 && gy<ROWS && gx>=0 && gx<COLS) newGrid[gy][gx] = (COLORS as any)[piece.key]
      }
    }
  }
  return newGrid
}

function clearLines(grid:any[][]){
  const newGrid = grid.map(r=>r.slice())
  let cleared = 0
  for(let r=ROWS-1;r>=0;r--){
    if(newGrid[r].every((cell:any)=>cell)){ newGrid.splice(r,1); newGrid.unshift(Array(COLS).fill(0)); cleared++; r++ }
  }
  return {grid:newGrid, cleared}
}

function tryRotate(grid:any[][], piece:Piece){
  const rotated = {...piece, shape: rotate(piece.shape)}
  if(!collide(grid,rotated)) return rotated
  const shifts = [-1,1,-2,2]
  for(const s of shifts){
    const moved = {...rotated, x: rotated.x + s}
    if(!collide(grid,moved)) return moved
  }
  return piece
}

function createQueue(n=6){
  const q:Piece[] = []
  for(let i=0;i<n;i++){ const p = randomTetromino(); q.push({...p, x:3, y:-2}) }
  return q
}
function createStart(){ const p = randomTetromino(); return {...p, x:3, y:-2} }

export default function GameBoard2(){
  const canvas1 = useRef<HTMLCanvasElement|null>(null)
  const canvas2 = useRef<HTMLCanvasElement|null>(null)

  const [grid1,setGrid1] = useState<any[][]>(makeEmptyGrid())
  const [grid2,setGrid2] = useState<any[][]>(makeEmptyGrid())

  const [queue1,setQueue1] = useState<Piece[]>(()=>createQueue())
  const [queue2,setQueue2] = useState<Piece[]>(()=>createQueue())

  const [piece1,setPiece1] = useState<Piece>(createStart())
  const [piece2,setPiece2] = useState<Piece>(createStart())

  const [held1,setHeld1] = useState<Piece|null>(null)
  const [held2,setHeld2] = useState<Piece|null>(null)
  const [holdUsed1,setHoldUsed1] = useState(false)
  const [holdUsed2,setHoldUsed2] = useState(false)

  const [score1,setScore1] = useState(0)
  const [score2,setScore2] = useState(0)

  const [running1,setRunning1] = useState(true)
  const [running2,setRunning2] = useState(true)
  const [gameOver,setGameOver] = useState(false)
  const [winner,setWinner] = useState<'player'|'opponent'|'draw'|null>(null)

  // draw
  function draw(canvas:HTMLCanvasElement|null, grid:any[][], active?:Piece){
    if(!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = COLS*CELL
    canvas.height = ROWS*CELL
    ctx.fillStyle = '#071226'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const v = grid[r][c]
        if(v){ ctx.fillStyle = v; ctx.fillRect(c*CELL, r*CELL, CELL-1, CELL-1) }
        else { ctx.strokeStyle = '#0b2233'; ctx.strokeRect(c*CELL, r*CELL, CELL, CELL) }
      }
    }
    if(active){
      ctx.fillStyle = (COLORS as any)[active.key] || '#fff'
      for(let r=0;r<active.shape.length;r++){
        for(let c=0;c<active.shape[r].length;c++){
          if(active.shape[r][c]){
            const gx = active.x + c
            const gy = active.y + r
            if(gy>=0) ctx.fillRect(gx*CELL, gy*CELL, CELL-1, CELL-1)
          }
        }
      }
    }
  }

  useEffect(()=> draw(canvas1.current, grid1, piece1), [grid1, piece1])
  useEffect(()=> draw(canvas2.current, grid2, piece2), [grid2, piece2])

  function spawn(player:number){
    if(player===1){
      setQueue1(q=>{
        const [, ...rest] = q
        const next = {...randomTetromino(), x:3, y:-2}
        setPiece1({...rest[0] || next})
        setHoldUsed1(false)
        return [...rest, next]
      })
    } else {
      setQueue2(q=>{
        const [, ...rest] = q
        const next = {...randomTetromino(), x:3, y:-2}
        setPiece2({...rest[0] || next})
        setHoldUsed2(false)
        return [...rest, next]
      })
    }
  }

  function lockAndClear(player:number, p:Piece){
    if(player===1){
      setGrid1(g=>{
        const ng = lockPieceToGrid(g,p)
        const res = clearLines(ng)
        if(res.cleared) setScore1(s=>s + res.cleared*100)
        if(res.cleared>1) receiveGarbage(2, res.cleared-1)
        return res.grid
      })
      spawn(1)
      setTimeout(()=>{
        const st = (piece1 as Piece)
        if(collide(grid1, st)){
          setRunning1(false); setGameOver(true); setWinner(running2? 'opponent' : 'draw')
        }
      }, 0)
    } else {
      setGrid2(g=>{
        const ng = lockPieceToGrid(g,p)
        const res = clearLines(ng)
        if(res.cleared) setScore2(s=>s + res.cleared*100)
        if(res.cleared>1) receiveGarbage(1, res.cleared-1)
        return res.grid
      })
      spawn(2)
      setTimeout(()=>{
        const st = (piece2 as Piece)
        if(collide(grid2, st)){
          setRunning2(false); setGameOver(true); setWinner(running1? 'player' : 'draw')
        }
      }, 0)
    }
  }

  function receiveGarbage(player:number, lines:number){
    const make = ()=>{ const hole = Math.floor(Math.random()*COLS); return Array.from({length:COLS}, (_,i)=> i===hole?0:'#222') }
    if(player===1) setGrid1(g=>{ const ng = g.map(r=>r.slice()); for(let i=0;i<lines;i++){ ng.shift(); ng.push(make()) } return ng })
    else setGrid2(g=>{ const ng = g.map(r=>r.slice()); for(let i=0;i<lines;i++){ ng.shift(); ng.push(make()) } return ng })
  }

  // gravity simple
  useEffect(()=>{
    if(!running1) return
    const id = setInterval(()=>{
      setPiece1(prev=>{
        const moved = {...prev, y: prev.y+1}
        if(collide(grid1, moved)){
          lockAndClear(1, prev)
          const st = {...(queue1[0] || randomTetromino()), x:3, y:-2}
          if(collide(grid1, st)) setRunning1(false)
          return st
        }
        return moved
      })
    }, 450)
    return ()=>clearInterval(id)
  },[grid1, running1, queue1])

  useEffect(()=>{
    if(!running2) return
    const id = setInterval(()=>{
      setPiece2(prev=>{
        const moved = {...prev, y: prev.y+1}
        if(collide(grid2, moved)){
          lockAndClear(2, prev)
          const st = {...(queue2[0] || randomTetromino()), x:3, y:-2}
          if(collide(grid2, st)) setRunning2(false)
          return st
        }
        return moved
      })
    }, 450)
    return ()=>clearInterval(id)
  },[grid2, running2, queue2])

  // controls
  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      if(!running1) return
      const k = e.key.toLowerCase()
      if(k==='a' || e.key==='arrowleft'){
        setPiece1(prev=>{ const moved = {...prev, x: prev.x-1}; if(collide(grid1,moved)) return prev; return moved })
      } else if(k==='d' || e.key==='arrowright'){
        setPiece1(prev=>{ const moved = {...prev, x: prev.x+1}; if(collide(grid1,moved)) return prev; return moved })
      } else if(k==='s' || e.key==='arrowdown'){
        setPiece1(prev=>{ const moved = {...prev, y: prev.y+1}; if(collide(grid1,moved)) return prev; return moved })
      } else if(k==='w' || e.key==='arrowup'){
        setPiece1(prev=> tryRotate(grid1, prev))
      } else if(k===' '){
        setPiece1(prev=>{ let p={...prev}; while(!collide(grid1,{...p,y:p.y+1})) p.y++; lockAndClear(1,p); const st = {...(queue1[0]||randomTetromino()), x:3,y:-2}; setPiece1(st); return st })
      } else if(k==='c'){
        setPiece1(prev=>{
          if(holdUsed1) return prev
          setHoldUsed1(true)
          if(!held1){ setHeld1({...prev, x:0,y:0}); const st = {...(queue1[0]||randomTetromino()), x:3,y:-2}; setPiece1(st); return st }
          const h = held1; setHeld1({...prev, x:0,y:0}); const st = {...h, x:3,y:-2}; setPiece1(st); return st
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  },[grid1, running1, held1, holdUsed1, queue1])

  // previews
  function PiecePreview({p, size=64}:{p:Piece|null, size?:number}){
    const cell = Math.floor(size/4)
    const cols = 'repeat(4, ' + cell + 'px)'
    const items = Array.from({length:16}).map((_,i)=>{
      const r = Math.floor(i/4); const c = i%4
      const show = p && p.shape[r] && p.shape[r][c]
      const color = p ? (COLORS as any)[p.key] : undefined
      return (<div key={i} style={{width:cell, height:cell, background: show? color : 'transparent'}}></div>)
    })
    return (<div style={{width:size, height:size, display:'grid', gridTemplateColumns: cols, gap:2}}>{items}</div>)
  }

  return (
    <div>
      <div style={{marginBottom:8}}>
        <button onClick={()=>{
          setGrid1(makeEmptyGrid()); setGrid2(makeEmptyGrid());
          setQueue1(createQueue()); setQueue2(createQueue());
          setPiece1(createStart()); setPiece2(createStart());
          setHeld1(null); setHeld2(null); setHoldUsed1(false); setHoldUsed2(false);
          setScore1(0); setScore2(0); setRunning1(true); setRunning2(true); setGameOver(false); setWinner(null)
        }}>Restart</button>
      </div>

      <div style={{display:'flex', gap:24}}>
        <div>
          <h4>Player</h4>
          <canvas ref={canvas1} style={{border:'1px solid #122'}} />
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <div>
              <div style={{fontSize:12, color:'#ccc'}}>Hold</div>
              <PiecePreview p={held1} />
            </div>
            <div>
              <div style={{fontSize:12,color:'#ccc'}}>Next</div>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                {queue1.slice(1,6).map((q,i)=> <PiecePreview key={i} p={q} size={36} />)}
              </div>
            </div>
          </div>
          <div>Score: {score1}</div>
        </div>

        <div>
          <h4>Opponent</h4>
          <canvas ref={canvas2} style={{border:'1px solid #122'}} />
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <div>
              <div style={{fontSize:12,color:'#ccc'}}>Hold</div>
              <PiecePreview p={held2} />
            </div>
            <div>
              <div style={{fontSize:12,color:'#ccc'}}>Next</div>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                {queue2.slice(1,6).map((q,i)=> <PiecePreview key={i} p={q} size={36} />)}
              </div>
            </div>
          </div>
          <div>Score: {score2}</div>
        </div>
      </div>

      {gameOver && winner && (
        <div style={{position:'fixed', left:0, top:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)'}}>
          <div style={{color:'#fff', textAlign:'center'}}>
            <h2>{winner==='player'? 'You Win!' : winner==='opponent'? 'You Lose' : 'Draw'}</h2>
            <button onClick={()=>{
              setGrid1(makeEmptyGrid()); setGrid2(makeEmptyGrid());
              setQueue1(createQueue()); setQueue2(createQueue());
              setPiece1(createStart()); setPiece2(createStart());
              setHeld1(null); setHeld2(null); setHoldUsed1(false); setHoldUsed2(false);
              setScore1(0); setScore2(0); setRunning1(true); setRunning2(true); setGameOver(false); setWinner(null)
            }}>Restart</button>
          </div>
        </div>
      )}
    </div>
  )
}
