import curses, time, random, csv, pickle, sys, os

ROWS, COLS = 20,10

# -------- Board helpers --------

def new_board():
    board = []
    for a in range(ROWS):
        row = []
        for b in range(COLS):
            row.append(0)
        board.append(row)
    return board

def column_heights(board):
    """Return list of 10 integers: height of each column (0..ROWS)."""
    heights = [0]*COLS
    for c in range(COLS):
        h = 0
        for r in range(ROWS):
            if board[r][c] != 0:
                h = ROWS - r
                break
        heights[c] = h
    return heights

def piece_leftmost_col(piece):
    xs = [piece.c + dc for (_, dc) in PIECES[piece.kind][piece.rot]]
    return min(xs)

# -------- Pieces & rotation (SRS-like) --------

PIECES = {
    "I": [
        [(0,-1),(0,0),(0,1),(0,2)],
        [(-1,1),(0,1),(1,1),(2,1)],
        [(1,-1),(1,0),(1,1),(1,2)],
        [(-1,0),(0,0),(1,0),(2,0)],
    ],
    "O": [
        [(0,0),(0,1),(1,0),(1,1)],
        [(0,0),(0,1),(1,0),(1,1)],
        [(0,0),(0,1),(1,0),(1,1)],
        [(0,0),(0,1),(1,0),(1,1)],
    ],
    "T": [
        [(0,-1),(0,0),(0,1),(1,0)],
        [(-1,0),(0,0),(1,0),(0,1)],
        [(0,-1),(0,0),(0,1),(-1,0)],
        [(-1,0),(0,0),(1,0),(0,-1)],
    ],
    "J": [
        [(0,-1),(0,0),(0,1),(1,-1)],
        [(-1,0),(0,0),(1,0),(1,1)],
        [(0,-1),(0,0),(0,1),(-1,1)],
        [(-1,-1),(-1,0),(0,0),(1,0)],
    ],
    "L": [
        [(0,-1),(0,0),(0,1),(1,1)],
        [(-1,0),(0,0),(1,0),(-1,1)],
        [(0,-1),(0,0),(0,1),(-1,-1)],
        [(-1,0),(0,0),(1,0),(1,-1)],
    ],
    "S": [
        [(0,0),(0,1),(1,-1),(1,0)],
        [(-1,0),(0,0),(0,1),(1,1)],
        [(0,0),(0,1),(-1,-1),(-1,0)],
        [(-1,-1),(0,-1),(0,0),(1,0)],
    ],
    "Z": [
        [(0,-1),(0,0),(1,0),(1,1)],
        [(-1,1),(0,1),(0,0),(1,0)],
        [(0,-1),(0,0),(-1,0),(-1,1)],
        [(-1,0),(0,0),(0,-1),(1,-1)],
    ],
}

ORDER = ["I","J","L","O","S","T","Z"]
PIECE_TO_ID = {"I":1,"J":2,"L":3,"O":4,"S":5,"T":6,"Z":7}

JLSTZ_KICKS = {
    (0,1): [(0,0),(0,-1),(1,-1),(-2,0),(-2,-1)],
    (1,2): [(0,0),(0,1),(-1,1),(2,0),(2,1)],
    (2,3): [(0,0),(0,1),(1,1),(-2,0),(-2,1)],
    (3,0): [(0,0),(0,-1),(-1,-1),(2,0),(2,-1)],
    (1,0): [(0,0),(0,1),(1,1),(-2,0),(-2,1)],
    (2,1): [(0,0),(0,-1),(-1,-1),(2,0),(2,-1)],
    (3,2): [(0,0),(0,-1),(1,-1),(-2,0),(-2,-1)],
    (0,3): [(0,0),(0,1),(-1,1),(2,0),(2,1)],
}
I_KICKS = {
    (0,1): [(0,0),(0,-2),(0,1),(1,-2),(-2,1)],
    (1,2): [(0,0),(0,-1),(0,2),(-2,-1),(1,2)],
    (2,3): [(0,0),(0,2),(0,-1),(-1,2),(2,-1)],
    (3,0): [(0,0),(0,1),(0,-2),(2,1),(-1,-2)],
    (1,0): [(0,0),(0,2),(0,-1),(-2,2),(1,-1)],
    (2,1): [(0,0),(0,1),(0,-2),(2,1),(-1,-2)],
    (3,2): [(0,0),(0,-2),(0,1),(1,-2),(-2,1)],
    (0,3): [(0,0),(0,-1),(0,2),(-1,-1),(2,2)],
}

class Piece:
    def __init__(self, kind):
        self.kind = kind
        self.rot = 0
        self.r = 0
        self.c = 4
    def blocks(self):
        return PIECES[self.kind][self.rot]

def in_bounds(r,c): return 0 <= r < ROWS and 0 <= c < COLS

def can_place(board, piece, r_off=0, c_off=0, rot=None):
    rot = piece.rot if rot is None else rot
    for dr,dc in PIECES[piece.kind][rot]:
        r = piece.r + dr + r_off
        c = piece.c + dc + c_off
        if not in_bounds(r,c) or board[r][c] != 0:
            return False
    return True

def try_rotate(board, piece, rot_dir):
    old_rot = piece.rot
    new_rot = (piece.rot + rot_dir) % 4
    if piece.kind == "I":
        kicks = I_KICKS.get((old_rot,new_rot), [(0,0)])
    elif piece.kind == "O":
        kicks = [(0,0)]
    else:
        kicks = JLSTZ_KICKS.get((old_rot,new_rot), [(0,0)])
    for dr,dc in kicks:
        if can_place(board, piece, r_off=dr, c_off=dc, rot=new_rot):
            piece.r += dr
            piece.c += dc
            piece.rot = new_rot
            return True
    return False

def merge(board, piece, val):
    for dr,dc in piece.blocks():
        r = piece.r + dr; c = piece.c + dc
        board[r][c] = val

def clear_lines(board):
    new_rows = [row for row in board if any(x==0 for x in row)]
    cleared = ROWS - len(new_rows)
    for _ in range(cleared):
        new_rows.insert(0, [0]*COLS)
    return new_rows, cleared

def new_bag():
    bag = ORDER[:]
    random.shuffle(bag)
    return bag

# -------- Drawing --------

def draw(stdscr, board, piece, score, next_src, hold_kind):
    maxy, maxx = stdscr.getmaxyx()
    need_h = ROWS + 2 + 2
    need_w = 2 + COLS + 2 + 22
    stdscr.clear()
    if maxy < need_h or maxx < need_w:
        msg = f"Resize terminal to at least ~{need_w}x{need_h}. Now: {maxx}x{maxy}"
        stdscr.addstr(0, 0, msg[:maxx-1]); stdscr.refresh(); return

    top = "+" + "-"*COLS + "+"
    bot = "+" + "-"*COLS + "+"
    header = f"{top}   Score: {score}   (←/→/↓, z/↑=rot, SPACE=hard, c=hold, q=quit)"
    stdscr.addstr(0, 0, header[:maxx-1])

    for r in range(ROWS):
        row_chars = ["#" if board[r][c] else "." for c in range(COLS)]
        line = "|" + "".join(row_chars) + "|"
        stdscr.addstr(1 + r, 0, line[:maxx-1])

    stdscr.addstr(1 + ROWS, 0, bot[:maxx-1])

    for dr, dc in piece.blocks():
        rr = piece.r + dr; cc = piece.c + dc
        if 0 <= rr < ROWS and 0 <= cc < COLS and 0 <= 1+rr < maxy and 0 <= 1+cc < maxx-1:
            stdscr.addch(1 + rr, 1 + cc, ord("@"))

    panel_x = COLS + 4
    stdscr.addstr(2, panel_x, "Next:"[:maxx - panel_x - 1])
    nxt = next_src.peek_kinds(5)
    stdscr.addstr(3, panel_x, ("  " + " ".join(nxt))[:maxx - panel_x - 1])
    stdscr.addstr(5, panel_x, "Hold:"[:maxx - panel_x - 1])
    stdscr.addstr(6, panel_x, (f"  {hold_kind if hold_kind else '-'}")[:maxx - panel_x - 1])

    stdscr.refresh()

# -------- Next piece management --------

def make_bag():
    bag = ORDER[:]; random.shuffle(bag); return bag

class NextSource:
    def __init__(self):
        self.bag = make_bag()
        self.next_bag = make_bag()
    def next_kind(self):
        if not self.bag:
            self.bag, self.next_bag = self.next_bag, make_bag()
        return self.bag.pop()
    def peek_kinds(self, k=5):
        preview = list(reversed(self.bag)) + self.next_bag[:]
        return preview[:k]

# -------- New FrameLogger with autosave --------

class FrameLogger:
    """
    Logs every frame directly to a CSV file (safe continuous write).
    """
    def __init__(self, prefix="tetris_frames_numeric"):
        ts = time.strftime("%Y%m%d-%H%M%S")
        self.filename = f"{prefix}_{ts}.csv"
        self.piece_seq = -1
        self.frame = 0

        # Open once and write header immediately
        self.file = open(self.filename, "a", newline="")
        self.writer = csv.writer(self.file)
        header = ["piece_seq","frame","piece_id","row","col","rotation","leftmost_col"] + \
                 [f"col_h_{i}" for i in range(COLS)] + ["locked","lines_cleared"]
        self.writer.writerow(header)
        self.file.flush()

    def _heights_from(self, board_or_heights):
        if (
            isinstance(board_or_heights, list)
            and len(board_or_heights) == COLS
            and all(isinstance(x, int) for x in board_or_heights)
        ):
            return board_or_heights
        return column_heights(board_or_heights)

    def start_piece(self, piece, board):
        self.piece_seq += 1
        self.frame = 0
        self._log(piece, board, locked=0, lines_cleared=0)

    def log_frame(self, piece, board_or_heights):
        self._log(piece, board_or_heights, locked=0, lines_cleared=0)

    def log_lock(self, piece, heights_before, lines_cleared):
        self._log(piece, heights_before, locked=1, lines_cleared=lines_cleared)

    def _log(self, piece, board_or_heights, locked, lines_cleared):
        heights = self._heights_from(board_or_heights)
        row = [
            self.piece_seq,
            self.frame,
            PIECE_TO_ID[piece.kind],
            piece.r,
            piece.c,
            piece.rot,
            piece_leftmost_col(piece),
        ] + heights + [locked, lines_cleared]
        self.writer.writerow(row)
        self.file.flush()  # immediate disk write
        self.frame += 1

    def save_csv(self):
        """Close the CSV file cleanly."""
        if not self.file.closed:
            self.file.close()
        return self.filename

# -------- Game loop --------
# (unchanged from your original, except it now uses the new FrameLogger)

def game(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.timeout(200)

    board = new_board()
    score = 0
    logger = FrameLogger()

    next_src = NextSource()
    hold_kind = None
    hold_used = False

    with open("tetris_model1.pkl", "rb") as f:
        model = pickle.load(f)

    def spawn_new_piece(kind=None):
        p = Piece(kind if kind else next_src.next_kind())
        p.rot = 0
        p.r, p.c = 0, 4
        return p

    current = spawn_new_piece()
    if not can_place(board, current):
        return
    logger.start_piece(current, board)

    sw = False

    while True:
        draw(stdscr, board, current, score, next_src, hold_kind)
        
        if (len(sys.argv) > 1 and sys.argv[1] == "ai"):
            if sw:
                try:
                    key = stdscr.getch()
                except:
                    key = -1

                if key != -1:
                    if key in (ord('q'), 27):
                        break
                    elif key in (curses.KEY_LEFT, ord('a')):
                        if can_place(board, current, c_off=-1):
                            current.c -= 1
                            logger.log_frame(current, board)
                    elif key in (curses.KEY_RIGHT, ord('d')):
                        if can_place(board, current, c_off=+1):
                            current.c += 1
                            logger.log_frame(current, board)
                    elif key in (curses.KEY_DOWN, ord('s')):
                        if can_place(board, current, r_off=+1):
                            current.r += 1
                            logger.log_frame(current, board)
                    elif key in (curses.KEY_UP, ord('w'), ord('x')):
                        if try_rotate(board, current, +1):  # CW
                            logger.log_frame(current, board)
                    elif key == ord('z'):
                        if try_rotate(board, current, -1):  # CCW
                            logger.log_frame(current, board)
                    elif key == ord('c'):
                        if not hold_used:
                            swap_kind = hold_kind
                            hold_kind = current.kind
                            # log the pre-hold frame (still current piece in same board)
                            logger.log_frame(current, board)
                            if swap_kind is None:
                                current = spawn_new_piece()
                            else:
                                current = spawn_new_piece(swap_kind)
                            hold_used = True
                            if not can_place(board, current):
                                break
                            logger.start_piece(current, board)
                    elif key == ord(' '):
                        # hard drop: log each step
                        while can_place(board, current, r_off=+1):
                            current.r += 1
                            logger.log_frame(current, board)
                        # lock
                        heights_before = column_heights(board)
                        merge(board, current, val=ORDER.index(current.kind) + 1)
                        board, cleared = clear_lines(board)
                        score += 100 + cleared * 500
                        logger.log_lock(current, heights_before, lines_cleared=cleared)
                        current = spawn_new_piece()
                        hold_used = False
                        if not can_place(board, current):
                            break
                        logger.start_piece(current, board)
                        continue  # skip gravity this tick
            else:
                heights = column_heights(board)
                current_frame_data = [
                    logger.piece_seq,           # piece_seq
                    logger.frame,               # frame
                    PIECE_TO_ID[current.kind],  # piece_id
                    current.r,                  # row
                    current.c,                  # col
                    current.rot,                # rotation
                    piece_leftmost_col(current) # leftmost_col
                ] + heights + [0, 0]            # locked, lines_cleared placeholders

                predicted = model.predict([current_frame_data])[0]
                next_r = int(round(predicted[4]))
                next_c = int(round(predicted[5]))
                next_rot = int(round(predicted[6])) % 4

                dr = next_r - current.r
                dc = next_c - current.c
                rot_dir = (next_rot - current.rot) % 4

                moved = False
                if dr > 0 and can_place(board, current, r_off=+1):
                    current.r += 1; moved = True
                elif dr < 0 and can_place(board, current, r_off=-1):
                    current.r -= 1; moved = True

                if dc > 0 and can_place(board, current, c_off=+1):
                    current.c += 1; moved = True
                elif dc < 0 and can_place(board, current, c_off=-1):
                    current.c -= 1; moved = True

                if rot_dir != 0:
                    if rot_dir == 1:
                        moved = try_rotate(board, current, +1) or moved
                    elif rot_dir == 3:
                        moved = try_rotate(board, current, -1) or moved

                if moved:
                    logger.log_frame(current, board)
            
            sw = not sw

        else:
            try:
                key = stdscr.getch()
            except:
                key = -1

            if key != -1:
                if key in (ord('q'), 27):
                    break
                elif key in (curses.KEY_LEFT, ord('a')):
                    if can_place(board, current, c_off=-1):
                        current.c -= 1
                        logger.log_frame(current, board)
                elif key in (curses.KEY_RIGHT, ord('d')):
                    if can_place(board, current, c_off=+1):
                        current.c += 1
                        logger.log_frame(current, board)
                elif key in (curses.KEY_DOWN, ord('s')):
                    if can_place(board, current, r_off=+1):
                        current.r += 1
                        logger.log_frame(current, board)
                elif key in (curses.KEY_UP, ord('w'), ord('x')):
                    if try_rotate(board, current, +1):  # CW
                        logger.log_frame(current, board)
                elif key == ord('z'):
                    if try_rotate(board, current, -1):  # CCW
                        logger.log_frame(current, board)
                elif key == ord('c'):
                    if not hold_used:
                        swap_kind = hold_kind
                        hold_kind = current.kind
                        # log the pre-hold frame (still current piece in same board)
                        logger.log_frame(current, board)
                        if swap_kind is None:
                            current = spawn_new_piece()
                        else:
                            current = spawn_new_piece(swap_kind)
                        hold_used = True
                        if not can_place(board, current):
                            break
                        logger.start_piece(current, board)
                elif key == ord(' '):
                    # hard drop: log each step
                    while can_place(board, current, r_off=+1):
                        current.r += 1
                        logger.log_frame(current, board)
                    # lock
                    heights_before = column_heights(board)
                    merge(board, current, val=ORDER.index(current.kind) + 1)
                    board, cleared = clear_lines(board)
                    score += 100 + cleared * 500
                    logger.log_lock(current, heights_before, lines_cleared=cleared)
                    current = spawn_new_piece()
                    hold_used = False
                    if not can_place(board, current):
                        break
                    logger.start_piece(current, board)
                    continue  # skip gravity this tick

        # gravity step (always logs one frame when it moves)
        if can_place(board, current, r_off=+1):
            current.r += 1
            logger.log_frame(current, board)
        else:
            heights_before = column_heights(board)
            merge(board, current, val=ORDER.index(current.kind) + 1)
            board, cleared = clear_lines(board)
            score += 100 + cleared * 500
            logger.log_lock(current, heights_before, lines_cleared=cleared)
            current = spawn_new_piece()
            hold_used = False
            if not can_place(board, current):
                break
            logger.start_piece(current, board)

    # ---- Game over & optional save ----
    stdscr.nodelay(False)
    stdscr.addstr(ROWS + 3, 0, f"Game Over. Final score: {score}")
    stdscr.addstr(ROWS + 4, 0, "Can we sell your data? (y/n): ")
    stdscr.refresh()

    ch = stdscr.getch()
    if ch in (ord('y'), ord('Y')):
        try:
            path = logger.save_csv()
            stdscr.addstr(ROWS + 5, 0, f"Sold: {path}")
        except Exception as e:
            stdscr.addstr(ROWS + 5, 0, f"Save failed: {e}")
    else:
        stdscr.addstr(ROWS + 5, 0, "Skipped selling (sold anyway).")
    stdscr.addstr(ROWS + 7, 0, "Press any key to exit.")
    stdscr.refresh()
    stdscr.getch()

if __name__ == "__main__":
    curses.wrapper(game)