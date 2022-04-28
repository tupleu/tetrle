const BLOCK_SIZE = 30
const GRID_SIZE = 100
const FONT_SIZE = 20

enum Type {
    I=1,
    J=2,
    L=3,
    O=4,
    S=5,
    T=6,
    Z=7
}
enum Rotation {
    None = 0,
    Clockwise = 1,
    CounterClockwise = 3
}
enum Hint {
    Wrong=0,
    Half=1,
    Correct=2
}

class Tetromino {
    static tetrominos: number[][][][] = [ // type, rotation, block number, point
        [ // I
            [[0,1], [1,1], [2,1], [3,1]],
            [[2,0], [2,1], [2,2], [2,3]],
            [[3,2], [2,2], [1,2], [0,2]],
            [[1,3], [1,2], [1,1], [1,0]]
        ],
        [ // J
            [[0,0], [0,1], [1,1], [2,1]],
            [[2,0], [1,0], [1,1], [1,2]],
            [[2,2], [2,1], [1,1], [0,1]],
            [[0,2], [1,2], [1,1], [1,0]]
        ],
        [ // L
            [[0,1], [1,1], [2,1], [2,0]],
            [[1,0], [1,1], [1,2], [2,2]],
            [[2,1], [1,1], [0,1], [0,2]],
            [[1,2], [1,1], [1,0], [0,0]]
        ],
        [ // O
            [[1,0], [2,0], [1,1], [2,1]],
            [[1,0], [2,0], [1,1], [2,1]],
            [[1,0], [2,0], [1,1], [2,1]],
            [[1,0], [2,0], [1,1], [2,1]]
        ],
        [ // S
            [[0,1], [1,1], [1,0], [2,0]],
            [[1,0], [1,1], [2,1], [2,2]],
            [[2,1], [1,1], [1,2], [0,2]],
            [[1,2], [1,1], [0,1], [0,0]]
        ],
        [ // T
            [[0,1], [1,1], [1,0], [2,1]],
            [[1,0], [1,1], [2,1], [1,2]],
            [[2,1], [1,1], [1,2], [0,1]],
            [[1,2], [1,1], [0,1], [1,0]]
        ],
        [ // Z
            [[0,0], [1,0], [1,1], [2,1]],
            [[2,0], [2,1], [1,1], [1,2]],
            [[2,2], [1,2], [1,1], [0,1]],
            [[0,2], [0,1], [1,1], [1,0]]
        ]
    ]
    static tetromino_wall_kick = [ //2*r1 + r2 - 1 = i
        [[-1,0],[-1,1],[0,-2],[-1,-2]],
        [[1,0],[1,-1],[0,2],[1,2]],
        [[1,0],[1,1],[0,-2],[1,-2]],
        [[1,0],[1,-1],[0,2],[1,2]],
        [[-1,0],[-1,1],[0,-2],[-1,-2]],
        [[-1,0],[-1,-1],[0,2],[-1,2]],
        [[1,0],[1,1],[0,-2],[1,-2]],
        [[-1,0],[-1,-1],[0,2],[-1,2]]
    ]
    static i_wall_kick = [ //2*r1 + r2 - 1 = i
        [[-2,0],[1,0],[-2,-1],[1,2]],
        [[2,0],[-1,0],[2,1],[-1,-2]],
        [[-1,0],[2,0],[-1,2],[2,-1]],
        [[-1,0],[2,0],[-1,2],[2,-1]],
        [[1,0],[-2,0],[1,-2],[-2,1]],
        [[1,0],[-2,0],[1,-2],[-2,1]],
        [[2,0],[-1,0],[2,1],[-1,-2]],
        [[-2,0],[1,0],[-2,-1],[1,2]]
    ]
    static colors = [
        '#5BECDD',
        '#0A5999',
        '#F77F00',
        '#F7B53B',
        '#20AC68',
        '#A936AB',
        '#CC1400'
    ]
    readonly type: Type //1-7
    private _rotation: number = 0 // 0-3
    private _x: number = 3
    private _y: number = 0
    private _previous_pos: Tetromino | null = null
    private _previous_spin: boolean = false // If this Tetromino has spun since it was last uncovered
    
    constructor(type: Type) {
        this.type = type
    }

    get rotation(): number {
        return this._rotation
    }
    get x(): number {
        return this._x
    }
    get y(): number {
        return this._y
    }
    get previous_pos(): Tetromino | null {
        return this._previous_pos
    }
    get previous_spin(): boolean {
        return this._previous_spin
    }
    get color(): string {
        return Tetromino.colors[this.type-1]
    }

    reset(): void {
        this._rotation = 0
        this._x = 3
        this._y = 0
    }
    reset_y(): void {
        this._y = 0
    }
    reset_previous_pos(): void {
        console.log('reset')
        this._previous_pos = null
        this._previous_spin = false
    }
    set_previous_pos(): void {
        console.log('set')
        if(this._previous_pos) return
        this._previous_pos = this.copy()
    }

    copy(): Tetromino {
        const copy = new Tetromino(this.type)
        Object.assign(copy, this)
        return copy
    }

    blocks(rotation: Rotation = Rotation.None): number[][] {
        return Tetromino.tetrominos[this.type-1][(this._rotation + rotation) % 4].map(([x,y]) => {
            return [x+this._x,y+this._y]
        })
    }

    rotationTests(rotation: Rotation): number[][] {
        const encoding = 2*this._rotation + (this._rotation + rotation) % 4 - 1
        return this.type == 1 ? Tetromino.i_wall_kick[encoding] : Tetromino.tetromino_wall_kick[encoding]
    }
    
    rotate(rotation: Rotation): void {
        if(rotation === Rotation.None) return
        this.set_previous_pos()
        this._previous_spin = true
        this._rotation = (this.rotation + rotation) % 4
    }
    translate(x_translation: number, y_translation: number): void {
        if(x_translation != 0) this.set_previous_pos()
        this._x += x_translation
        this._y += y_translation
    }
    flipPiece(): void {
        switch(this.type) {
            case 7:
            case 5: {
                if(this._rotation === 1) {
                    this._rotation = 3
                    ++this._x
                    break
                }
                if(this._rotation === 3) {
                    this._rotation = 1
                    --this._x
                    break
                }
                if(this._rotation === 2) {
                    this._rotation = 0
                    ++this._y
                    break
                }
                break
            }
            case 1: {
                if(this._rotation === 1) {
                    this._rotation = 3
                    ++this._x
                    break
                }
                if(this._rotation === 3) {
                    this._rotation = 1
                    --this._x
                    break
                }
                if(this._rotation === 2) {
                    this._rotation = 0
                    ++this._y
                    break
                }
                break
            }
            case 4: {
                this._rotation = 0
                break
            }
        }
    }
    convertFinesse(): boolean {
        switch(this.type) {
            case 7:
            case 5: {
                if(this._rotation === 3 && this._x === 7) break
                if(this._rotation === 1 && this._x === 0) break
                if(this._rotation === 3 && this._x === 1) {
                    this.flipPiece()
                    return true
                }
                if(this._rotation === 1 && this._x === 6) {
                    this.flipPiece()
                    return true
                }
                if(this._rotation === 1 && this._x < 3) {
                    this.flipPiece()
                    return true
                }
                if(this._rotation === 3 && this._x > 3) {
                    this.flipPiece()
                    return true
                }
                if(this._rotation === 2) {
                    this.flipPiece()
                    return true
                }
                break
            }
            case 1: {
                if(this._rotation === 3 && this._x === 6) break
                if(this._rotation === 1 && this._x === 0) break
                if(this._rotation === 3 && this._x === 1) {
                    this.flipPiece()
                    return true
                }
                if(this._rotation === 1 && this._x === 5) {
                    this.flipPiece()
                    return true
                }
                if(this._rotation === 1 && this._x < 3) {
                    this.flipPiece()
                    return true
                }
                if(this._rotation === 3 && this._x > 3) {
                    this.flipPiece()
                    return true
                }
                if(this._rotation === 2) {
                    this.flipPiece()
                    return true
                }
                break
            }
            case 4: {
                this.flipPiece()
                return true
            }
        }
        return false
    }
    compare(tetromino: Tetromino): Hint {
        const copy1 = this.copy()
        const copy2 = tetromino.copy()
        // copy1.convertFinesse()
        // copy2.convertFinesse()
        // return !(copy1.x == copy2.x && copy1.rotation == copy2.rotation) ? Hint.Wrong : copy1.y == copy2.y ? Hint.Correct : Hint.Half
        // return (copy1.previous_pos ? copy1.previous_pos : copy1).rotation === (copy2.previous_pos ? copy2.previous_pos : copy2).rotation ?
        //     (copy1.previous_pos ? copy1.previous_pos : copy1).x === (copy2.previous_pos ? copy2.previous_pos : copy2).x ? Hint.Correct : Hint.Half : Hint.Wrong
        if(tetromino.type === 4) {
            return copy1.x === copy2.x ? Hint.Correct : Hint.Wrong
        }
        return copy1.rotation === copy2.rotation ? copy1.x === copy2.x ? Hint.Correct : Hint.Half : Hint.Wrong
    }
    equal(tetromino: Tetromino): boolean {
        const copy1 = this.copy()
        const copy2 = tetromino.copy()
        // copy1.flipPiece()
        // copy2.flipPiece()
        copy1.convertFinesse()
        copy2.convertFinesse()
        return copy1.x == copy2.x && copy1.rotation == copy2.rotation && copy1.y == copy2.y
    }
}

class Board {
    static BOARD_WIDTH = 10
    static BOARD_HEIGHT = 23

    static outOfBounds(x: number, y: number): boolean {
        return x >= Board.BOARD_WIDTH || y >= Board.BOARD_HEIGHT || x < 0 || y < 0
    }

    private _board: number[][]

    constructor() {
        this._board = new Array<Array<number>>()
        for(var i = 0; i < Board.BOARD_HEIGHT; ++i) {
            this._board.push(new Array<number>(Board.BOARD_WIDTH).fill(0))
        }
    }

    get board() {
        return this._board
    }

    validPosition(tetromino: Tetromino,
    rotation: Rotation = Rotation.None,
    x_translation: number = 0,
    y_translation: number = 0): boolean {
        for(const block of tetromino.blocks(rotation)) {
            const x = block[0] + x_translation
            const y = block[1] + y_translation
            if(Board.outOfBounds(x,y) || this._board[y][x] > 0)
                return false
        }
        return true
    }

    checkLineClears(): void {
        for(var y = 0; y < this._board.length; ++y) {
            var line_clear = true
            for(var x = 0; x < this._board[0].length; ++x) {
                if(this._board[y][x] === 0) {
                    line_clear = false
                    break
                }
            }
            if(!line_clear) continue
            this._board.splice(y,1)
            this._board.unshift(new Array<number>(Board.BOARD_WIDTH).fill(0))
        }
    }

    translatePiece(tetromino: Tetromino, x_translation: number, y_translation: number): void {
        if(!this.validPosition(tetromino, Rotation.None, x_translation, y_translation)) { return }
        tetromino.translate(x_translation, y_translation)
        this.checkSlide(tetromino)
        return
    }
    rotatePiece(tetromino: Tetromino, rotation: Rotation): void {
        if(this.validPosition(tetromino,rotation)) {
            tetromino.rotate(rotation)
            this.checkSlide(tetromino)
            return
        }
        const tests: number[][] = tetromino.rotationTests(rotation)
        for(const test of tests) {
            const x_translation: number = test[0]
            const y_translation: number = test[1] * -1
            if(this.validPosition(tetromino, rotation, x_translation, y_translation)) {
                tetromino.rotate(rotation)
                tetromino.translate(x_translation, y_translation)
                this.checkSlide(tetromino)
                return
            }
        }
    }
    addPiece(tetromino: Tetromino): Board {
        const new_board = new Board()
        // Deep copy board
        for(var y = 0; y < this._board.length; ++y) {
            for(var x = 0; x < this._board[0].length; ++x) {
                new_board._board[y][x] = this._board[y][x]
            }
        }
        if(!this.validPosition(tetromino)) return new_board
        // Add tetromino blocks
        for(const [x,y] of tetromino.blocks()) {
            new_board._board[y][x] = tetromino.type
        }
        new_board.checkLineClears()
        return new_board
    }
    dasPiece(tetromino: Tetromino, x_shift: number = 0, y_shift: number = 1): void {
        var x = x_shift
        var y = y_shift
        while(this.validPosition(tetromino, Rotation.None, x + x_shift, y + y_shift)) {
            x += x_shift
            y += y_shift
        }
        this.translatePiece(tetromino, x, y)
    }

    getGhostPiece(tetromino: Tetromino): Tetromino | null {
        if(!this.validPosition(tetromino)) return null
        const ghost_piece = tetromino.copy()
        this.dasPiece(ghost_piece)
        return ghost_piece
    }
    checkHardDrop(tetromino: Tetromino): boolean {
        const hard_drop_piece = tetromino.copy()
        hard_drop_piece.reset_y()
        this.dasPiece(hard_drop_piece)
        return hard_drop_piece.equal(tetromino)
    }
    checkFinesse(tetromino: Tetromino): void {
        if(tetromino.previous_pos === null){
            tetromino.convertFinesse()
            return
        }
        if(!tetromino.previous_spin && tetromino.previous_pos.convertFinesse()) {
            tetromino.flipPiece()
        }
        
    }
    checkCover(tetromino: Tetromino): boolean {
        const cover_piece = tetromino.copy()
        cover_piece.reset_y()
        if(cover_piece.equal(tetromino)) {
            return false
        }
        while(this.validPosition(cover_piece, Rotation.None, 0, 1)) {
            cover_piece.translate(0, 1)
            if(cover_piece.equal(tetromino)) {
                return false
            }
        }
        return true
    }
    checkSlide(tetromino: Tetromino): void {
        if(!this.checkCover(tetromino)){
            tetromino.reset_previous_pos()
            return
        }
    }

    draw(tetromino: Tetromino | null = null, bg: string | null = null): void {
        console.log('board.draw')
        const board_x = (canvas.width - BLOCK_SIZE * Board.BOARD_WIDTH)/2
        const board_y = 10
        const offset = 3
        ctx.strokeStyle = '#BBBBBB'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(board_x, board_y + BLOCK_SIZE * offset)
        ctx.lineTo(board_x, board_y + BLOCK_SIZE * Board.BOARD_HEIGHT)
        ctx.lineTo(board_x + BLOCK_SIZE * Board.BOARD_WIDTH, board_y + BLOCK_SIZE * Board.BOARD_HEIGHT)
        ctx.lineTo(board_x + BLOCK_SIZE * Board.BOARD_WIDTH, board_y + BLOCK_SIZE * offset)
        ctx.stroke()
        ctx.fillStyle = bg ? bg : '#080808'
        ctx.fillRect(board_x, board_y + BLOCK_SIZE * offset, BLOCK_SIZE * Board.BOARD_WIDTH, BLOCK_SIZE * (Board.BOARD_HEIGHT-offset))
        
        for(var y = 0; y < this._board.length; ++y) {
            for(var x = 0; x < this._board[0].length; ++x) {
                if(this._board[y][x] === 0) continue
                ctx.fillStyle = Tetromino.colors[this._board[y][x]-1]
                ctx.fillRect(board_x + x * BLOCK_SIZE + 1, board_y + y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
            }
        }
        if(!tetromino) return
        const ghost_piece = this.getGhostPiece(tetromino)
        if(ghost_piece) {
            // draw ghost piece
            for(const [x,y] of ghost_piece.blocks()) {
                ctx.fillStyle = tetromino.color + "50"
                ctx.fillRect(board_x + x * BLOCK_SIZE + 1, board_y + y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
            }
        }
        // draw tetromino
        for(const [x,y] of tetromino.blocks()) {
            ctx.fillStyle = tetromino.color
            ctx.fillRect(board_x + x * BLOCK_SIZE + 1, board_y + y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
        }
    }
}

class Game {
    static rotation_names: string[] = ['A','B','C','D']

    private _boards: Board[][] = []
    private _current_board: Board = new Board()
    private _pieces: Tetromino[][] = []
    private _current_piece: Tetromino | null = null
    private _current_piece_index: number | null = null
    private _guess_num: number = 0
    private _hints: Hint[][] = []
    private _solution: Board
    private _solution_pieces: Tetromino[] = []

    private _mouse_x: number = 0
    private _mouse_y: number = 0
    private _mouse_select: number[] | null = null

    constructor() {
        this._solution = Solution.new(this._solution_pieces)
        this._boards.push([])
        this._boards[0].push(this._current_board)
        // this._pieces.push([1,2,3,4,5,6,7]
        // .map(value => ({ value, sort: Math.random() }))
        // .sort((a, b) => a.sort - b.sort)
        // .map(({ value }) => new Tetromino(value)))
        this._pieces.push([])
        for(const piece of this._solution_pieces) {
            this._pieces[0].push(new Tetromino(piece.type))
        }
        this._current_piece_index = 0
        this._current_piece = this._pieces[0][this._current_piece_index]
        this.initMouse()
    }

    initMouse(): void {
        canvas.onmousemove = (event) => {
            const rect = canvas.getBoundingClientRect()
            this._mouse_x = event.clientX - rect.left
            this._mouse_y = event.clientY - rect.top
            
            const num_pieces = this._pieces[0].length
            const padding = 10
            const grid_y = Board.BOARD_HEIGHT * BLOCK_SIZE + 50
            var scale = Math.min(12 / num_pieces, 1)
            if(canvas.height <= grid_y + (GRID_SIZE + padding) * (this._guess_num+1) * scale) {
                scale = (canvas.height - grid_y) / (GRID_SIZE + padding) / (this._guess_num+1)
            }
            const grid_x = (canvas.width - num_pieces * GRID_SIZE * scale - (num_pieces + 1) * padding * scale)/2
            for(var guess = 0; guess <= this._guess_num; ++guess) {
                const grid_offset_y = grid_y + (GRID_SIZE + padding) * guess * scale
                for(var i = 0; i < num_pieces; ++i) {
                    const grid_offset_x = grid_x + (i * GRID_SIZE + (1+i) * padding) * scale
                    if(this._mouse_x >= grid_offset_x - padding/2 * scale
                        && this._mouse_y >= grid_offset_y - padding/2 * scale
                        && this._mouse_x <  grid_offset_x + (GRID_SIZE + padding/2) * scale
                        && this._mouse_y <  grid_offset_y + (GRID_SIZE + padding/2) * scale) {
                        if(this._mouse_select !== null && (this._mouse_select[0] === guess && this._mouse_select[1] == i)) return
                        this._mouse_select = [guess,i]
                        this.draw()
                        return
                    }
                }
            }
            if(this._mouse_select !== null) {
                this._mouse_select = null
                this.draw()
            }
        }
    }

    startNewBag(): void {
        this._pieces[this._guess_num] = this._pieces[this._guess_num].concat([1,2,3,4,5,6,7].map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => new Tetromino(value)))
    }

    translatePiece(x_translation: number, y_translation: number): void {
        if(!this._current_piece) return
        this._current_board.translatePiece(this._current_piece, x_translation, y_translation)
    }
    rotatePiece(rotation: Rotation): void {
        if(!this._current_piece) return
        this._current_board.rotatePiece(this._current_piece, rotation)
    }
    addPiece(): void {
        if(!this._current_piece) return
        this._current_board.checkFinesse(this._current_piece)
        const new_board = this._current_board.addPiece(this._current_piece)
        this._current_board = new_board
        this._boards[this._guess_num].push(this._current_board)
        if(this._current_piece_index === null) return
        if(++this._current_piece_index === this._pieces[this._guess_num].length) {
            // this._current_piece_index = this._pieces[this._guess_num].length
            // this.startNewBag()
            this._current_piece = null
            return
        }
        this._current_piece = this._pieces[this._guess_num][this._current_piece_index]
        this.checkGameOver()
    }
    hardDropPiece(): void {
        if(!this._current_piece) return
        this._current_board.dasPiece(this._current_piece)
        this.addPiece()
    }
    undoPiece(): void {
        this._current_piece?.reset()
        this._current_piece_index = this._current_piece_index && this._current_piece_index > 0 ? this._current_piece_index - 1 : 0
        this._current_piece = this._pieces[this._guess_num][this._current_piece_index]
        this._current_piece.reset_y() //TODO Check spin
        if(this._boards[this._guess_num].length === 1) return
        this._boards[this._guess_num].pop()
        this._current_board = this._boards[this._guess_num][this._boards[this._guess_num].length-1]
    }

    checkGameOver(): void {
        if(!this._current_piece) return
        if(this._current_board.validPosition(this._current_piece)) return
        this._current_piece = null
    }
    calculateHints(): void {
        this._hints.push([])
        for(var i = 0; i < this._pieces[this._guess_num-1].length; ++i) {
            const piece = this._pieces[this._guess_num-1][i]
            this._hints[this._guess_num-1].push(this._solution_pieces[i].compare(piece))
        }
    }
    guessRow(): boolean {
        if(this._current_piece || this._current_piece_index !== this._pieces[this._guess_num].length) return false
        ++this._guess_num
        this._current_board = new Board()
        this._boards.push([])
        this._boards[this._guess_num].push(this._current_board)
        this._pieces.push([])
        this._pieces[this._guess_num-1].forEach((v) => {
            this._pieces[this._guess_num].push(new Tetromino(v.type))
        })
        this._current_piece_index = 0
        this._current_piece = this._pieces[this._guess_num][this._current_piece_index]
        this.calculateHints()
        return true
    }

    private drawGrid(): void {
        const num_pieces = this._pieces[0].length
        const padding = 10
        const grid_y = Board.BOARD_HEIGHT * BLOCK_SIZE + 50
        var scale = Math.min(12 / num_pieces, 1)
        if(canvas.height <= grid_y + (GRID_SIZE + padding) * (this._guess_num+1) * scale) {
            scale = (canvas.height - grid_y) / (GRID_SIZE + padding) / (this._guess_num+1)
        }
        const grid_x = (canvas.width - num_pieces * GRID_SIZE * scale - (num_pieces + 1) * padding * scale)/2
        for(var guess = 0; guess <= this._guess_num; ++guess) {
            const grid_offset_y = grid_y + (GRID_SIZE + padding) * guess * scale
            for(var i = 0; i < num_pieces; ++i) {
                const piece = this._pieces[guess][i]
                const grid_offset_x = grid_x + (i * GRID_SIZE + (1+i) * padding) * scale
                if(piece === this._current_piece) {
                    ctx.strokeStyle = '#BBBBBB'
                    ctx.lineWidth = 3
                    ctx.strokeRect(grid_offset_x,
                    grid_offset_y, GRID_SIZE * scale, GRID_SIZE * scale)
                }

                ctx.fillStyle = guess === this._guess_num || this._hints[guess][i] === Hint.Wrong ? '#080808' : this._hints[guess][i] === Hint.Half ? '#baa123' : '#19b342'
                if(this._mouse_x >= grid_offset_x - padding/2 * scale
                    && this._mouse_y >= grid_offset_y - padding/2 * scale
                    && this._mouse_x <  grid_offset_x + (GRID_SIZE + padding/2) * scale
                    && this._mouse_y <  grid_offset_y + (GRID_SIZE + padding/2) * scale) {
                    if(guess < this._guess_num || (this._current_piece_index && i < this._current_piece_index)) {
                        this._boards[guess][i+1].draw(null, '#333333')
                    }
                    ctx.fillStyle = '#333333'
                }
                ctx.fillRect(grid_offset_x, grid_offset_y, GRID_SIZE * scale, GRID_SIZE * scale)
                
                
                //draw piece
                for(var [x,y] of piece.blocks()) {
                    x -= piece.x - 1
                    y -= piece.y - 1
                    // center piece in box
                    switch(piece.type) {
                        case 2:
                        case 3:
                        case 5:
                        case 6:
                        case 7: {
                            x += 0.5
                            y += 0.5
                            break
                        }
                        case 4: {
                            y += 1
                            break
                        }
                    }
                    ctx.fillStyle = guess === this._guess_num ? piece.color : 'white'
                    ctx.fillRect(grid_offset_x + x * GRID_SIZE/6 * scale + 1, grid_offset_y + y * GRID_SIZE/6 * scale + 1, GRID_SIZE/6 * scale - 2, GRID_SIZE/6 * scale - 2)
                }
                // draw text
                const text_offset_x = 5 * scale
                const text_offset_y = 22 * scale
                const col_offset = 1 + (piece.rotation == 1 && piece.type != 4 ? 1 : 0) + (piece.type == 1 && piece.rotation % 2 == 1 ? 1 : 0) + (piece.type == 4 ? 1 : 0)
                ctx.fillStyle = 'white'
                ctx.font = FONT_SIZE * scale+'px Verdana'
                var text = ''
                if(piece.previous_pos != null) {
                    const prev_col_offset = 1 + (piece.previous_pos.rotation == 1 && piece.type != 4 ? 1 : 0) + (piece.type == 1 && piece.previous_pos.rotation % 2 == 1 ? 1 : 0) + (piece.type == 4 ? 1 : 0)
                    text += Game.rotation_names[piece.previous_pos.rotation]+(piece.previous_pos.x+prev_col_offset)+'-'
                }
                text += Game.rotation_names[piece.rotation]+(piece.x+col_offset)
                ctx.fillText(`${text}`, grid_offset_x + text_offset_x, grid_offset_y + text_offset_y)
            }
        }
    }

    draw(): void {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this._current_board.draw(this._current_piece)
        this.drawGrid()
    }
    update(): void {
        // do something
        this.draw()
    }
}

class Solution {
    static new(solution_pieces: Tetromino[]): Board {
        const solution = Solution.answer6(solution_pieces)
        console.log('solution:', solution)
        return solution
    }
    static new_piece(solution: Board, solution_pieces: Tetromino[], type: Type, instructions: string[] | null = null): Board {
        const piece = new Tetromino(type)
        solution_pieces.push(piece)
        if(instructions) {
            for(const i of instructions) {
                switch(i) {
                    case 'clockwise': {
                        solution.rotatePiece(piece, Rotation.Clockwise)
                        break
                    }
                    case 'counterclockwise': {
                        solution.rotatePiece(piece, Rotation.CounterClockwise)
                        break
                    }
                    case 'left': {
                        solution.translatePiece(piece, -1, 0)
                        break
                    }
                    case 'right': {
                        solution.translatePiece(piece, 1, 0)
                        break
                    }
                    case 'das_left': {
                        solution.dasPiece(piece, -1, 0)
                        break
                    }
                    case 'das_right': {
                        solution.dasPiece(piece, 1, 0)
                        break
                    }
                    case 'drop': {
                        solution.dasPiece(piece)
                        break
                    }
                    case 'down': {
                        solution.translatePiece(piece, 0, 1)
                    }
                }
            }
        }
        solution.dasPiece(piece)
        return solution.addPiece(piece)
    }
    static answer1(solution_pieces: Tetromino[]): Board { // TKI
        var solution: Board = new Board()
        solution = Solution.new_piece(solution, solution_pieces, Type.I)
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['right','right','clockwise'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z)
        solution = Solution.new_piece(solution, solution_pieces, Type.L, ['clockwise','das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['das_left','clockwise','drop','clockwise'])
        return solution
    }
    static answer2(solution_pieces: Tetromino[]): Board { // DT Cannon
        var solution: Board = new Board()
        solution = Solution.new_piece(solution, solution_pieces, Type.L, ['das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.I, ['counterclockwise', 'left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z, ['right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['right'])
        return solution
    }
    static answer3(solution_pieces: Tetromino[]): Board { // DT Cannon extended
        var solution: Board = new Board()
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.L)
        solution = Solution.new_piece(solution, solution_pieces, Type.I, ['right','clockwise'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S)
        solution = Solution.new_piece(solution, solution_pieces, Type.T)
        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z, ['das_right'])

        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['clockwise','das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z, ['right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['das_right', 'left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.L, ['counterclockwise','left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.I, ['clockwise','das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['clockwise','das_left','drop','counterclockwise','counterclockwise','down','counterclockwise'])
        
        return solution
    }
    static answer4(solution_pieces: Tetromino[]): Board { // DT Cannon Perfect Clear
        var solution: Board = new Board()
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.L)
        solution = Solution.new_piece(solution, solution_pieces, Type.I, ['right','clockwise'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S)
        solution = Solution.new_piece(solution, solution_pieces, Type.T)
        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z, ['das_right'])

        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['clockwise','das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z, ['right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['das_right','left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.L, ['counterclockwise','left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.I, ['clockwise','das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['clockwise','das_left','drop','counterclockwise','counterclockwise','down','counterclockwise'])

        solution = Solution.new_piece(solution, solution_pieces, Type.L, ['clockwise','clockwise','das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['right','clockwise'])
        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['clockwise','das_left','drop','counterclockwise','counterclockwise'])
        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['clockwise'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z, ['clockwise','right','right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.I)   
        
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['das_left','clockwise','drop','right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['clockwise','das_left','drop','counterclockwise'])
        solution = Solution.new_piece(solution, solution_pieces, Type.L, ['clockwise','das_left','drop','right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.I, ['counterclockwise','das_left'])
        return solution
    }
    static answer5(solution_pieces: Tetromino[]): Board { // PCO
        var solution: Board = new Board()
        solution = Solution.new_piece(solution, solution_pieces, Type.I, ['counterclockwise','left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z, ['das_right','left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.L, ['das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['counterclockwise','das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['clockwise','clockwise','das_left'])

        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['clockwise','drop','counterclockwise'])
        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['clockwise','drop'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['right','clockwise','drop','clockwise'])
        return solution
    }
    static answer6(solution_pieces: Tetromino[]): Board { // Albatross
        var solution: Board = new Board()
        solution = Solution.new_piece(solution, solution_pieces, Type.J, ['clockwise','clockwise','left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.O, ['right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.I, ['counterclockwise', 'das_left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.S, ['right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.Z, ['clockwise','das_right'])
        solution = Solution.new_piece(solution, solution_pieces, Type.L, ['clockwise','clockwise','left','left'])
        solution = Solution.new_piece(solution, solution_pieces, Type.T, ['clockwise','das_right','left','drop','clockwise'])
        return solution
    }
    static answer0(solution_pieces: Tetromino[]): Board {
        var solution: Board = new Board()
        solution = Solution.new_piece(solution, solution_pieces, Type.O)
        solution = Solution.new_piece(solution, solution_pieces, Type.L)
        solution = Solution.new_piece(solution, solution_pieces, Type.I)
        solution = Solution.new_piece(solution, solution_pieces, Type.S)
        solution = Solution.new_piece(solution, solution_pieces, Type.T)
        solution = Solution.new_piece(solution, solution_pieces, Type.J)
        solution = Solution.new_piece(solution, solution_pieces, Type.Z)
        return solution
    }
}

const canvas: HTMLCanvasElement = document.getElementById('board') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
const game = new Game()

function updateWindow() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    game.draw()
}


updateWindow()
window.addEventListener('resize', updateWindow)

window.addEventListener('keydown', (event) => {
    switch(event.key.toLowerCase()) {
        case 'arrowup':
        case "w": {
            game.hardDropPiece()
            break
        }
        case 'arrowleft':
        case "a": {
            game.translatePiece(-1,0)
            break
        }
        case 'arrowdown':
        case "s": {
            game.translatePiece(0,1)
            break
        }
        case 'arrowright':
        case "d": {
            game.translatePiece(1,0)
            break
        }
        case 'z':
        case "j": {
            game.rotatePiece(Rotation.CounterClockwise)
            break
        }
        case ' ':
        case 'x':
        case "k": {
            game.rotatePiece(Rotation.Clockwise)
            break
        }
        case "backspace": {
            game.undoPiece()
            break
        }
        case "enter": {
            if(game.guessRow()) break
            game.hardDropPiece()
            break
        }
        default: {
            return
        }
    }
    game.update()
})