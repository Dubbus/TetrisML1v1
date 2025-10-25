import { Shape, SHAPES, SHAPE_KEYS } from './TetrominoConstants'

export function rotate(shape: Shape): Shape{
  const rows = shape.length
  const cols = shape[0].length
  const out = Array.from({length: cols}, ()=>Array(rows).fill(0))
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) out[c][rows-1-r]=shape[r][c]
  return out
}

export function randomTetromino(){
  const key = SHAPE_KEYS[Math.floor(Math.random()*SHAPE_KEYS.length)]
  return { key, shape: SHAPES[key] }
}
