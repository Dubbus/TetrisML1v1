// Quick simulation of 7-bag queue logic to verify no consecutive identical pieces
const SHAPES = ['I','O','T','S','Z','J','L']

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); const t = arr[i]; arr[i]=arr[j]; arr[j]=t }
  return arr
}

function createQueue(n=6){
  const q = []
  while(q.length < n){
    const bag = shuffle(SHAPES.slice())
    for(const k of bag){ if(q.length>=n) break; q.push(k) }
  }
  return q
}

function makeBagAvoid(last){
  const b = shuffle(SHAPES.slice())
  // if the new bag would start with the same piece as last, rotate until different
  if(typeof last !== 'undefined'){
    let attempts = 0
    while(b[0] === last && attempts < 10){ b.push(b.shift()); attempts++ }
  }
  return b
}

function simulate(iterations=10000){
  let queue = createQueue(6)
  let bag = makeBag()
  let current = queue[0]
  // ensure current aligns with queue
  let last = current
  queue = queue.slice() // copy

  for(let i=0;i<iterations;i++){
    // spawn next: remove first of queue and take next as candidate
    // emulate spawn: const [, ...rest] = queue; candidate = rest[0] ? rest[0] : drawFromBag
    const [, ...rest] = queue
  let candidate = rest[0] ? rest[0] : (bag.length ? bag.shift() : (bag = makeBagAvoid(last), bag.shift()))
    // check consecutive
    if(candidate === last){
      console.error('Consecutive duplicate at step', i, 'candidate', candidate)
      return false
    }
    // advance
    last = candidate
  const append = bag.length ? bag.shift() : (bag = makeBagAvoid(last), bag.shift())
    queue = [...rest, append]
  }
  return true
}

console.log('simulate 1:', simulate(10000))
console.log('simulate 2:', simulate(10000))
console.log('Done')
