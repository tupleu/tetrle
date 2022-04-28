const BLOCK_SIZE = 40 //px
// const GRID_SIZE = 200
// const FONT_SIZE = 20

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
        this._previous_pos = null
        this._previous_spin = false
    }
    set_previous_pos(): void {
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
        // const copy1 = this.copy()
        // const copy2 = tetromino.copy()
        // copy1.convertFinesse()
        // copy2.convertFinesse()
        // return !(copy1.x == copy2.x && copy1.rotation == copy2.rotation) ? Hint.Wrong : copy1.y == copy2.y ? Hint.Correct : Hint.Half
        // return (copy1.previous_pos ? copy1.previous_pos : copy1).rotation === (copy2.previous_pos ? copy2.previous_pos : copy2).rotation ?
        //     (copy1.previous_pos ? copy1.previous_pos : copy1).x === (copy2.previous_pos ? copy2.previous_pos : copy2).x ? Hint.Correct : Hint.Half : Hint.Wrong
        if(tetromino.type === 4) {
            return this.x === tetromino.x ? Hint.Correct : Hint.Wrong
        }
        if(this.previous_pos && tetromino.previous_pos) {
            // const copy1 = this.copy()
            // const copy2 = tetromino.copy()
            // copy1.convertFinesse()
            // copy2.convertFinesse()
            return this.equal(tetromino) ? Hint.Correct : this.rotation === tetromino.rotation ? Hint.Half : Hint.Wrong
        }
        if(this.rotation !== tetromino.rotation) {
            return this.equal(tetromino) ? Hint.Correct : Hint.Wrong
        }
        if((this.previous_pos === null) !== (tetromino.previous_pos === null)) { //if either is a slide, but not both
            return Hint.Half
        }
        
        return this.x === tetromino.x ? Hint.Correct : Hint.Half
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
        var x = 0
        var y = 0
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
        const board_x = (canvas.width - BLOCK_SIZE * Board.BOARD_WIDTH)/2
        const board_y = 40
        const offset = 3
        const t = 2 // line thickness

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = bg ? bg : '#080808'
        ctx.fillRect(board_x, board_y + BLOCK_SIZE * offset, BLOCK_SIZE * Board.BOARD_WIDTH, BLOCK_SIZE * (Board.BOARD_HEIGHT-offset))
        
        for(var y = 0; y < this._board.length; ++y) {
            for(var x = 0; x < this._board[0].length; ++x) {
                if(this._board[y][x] === 0) continue
                ctx.fillStyle = Tetromino.colors[this._board[y][x]-1]
                ctx.fillRect(board_x + x*BLOCK_SIZE + t, board_y + y*BLOCK_SIZE + t, BLOCK_SIZE - 2*t, BLOCK_SIZE - 2*t)
            }
        }
        if(!tetromino) return
        const ghost_piece = this.getGhostPiece(tetromino)
        if(ghost_piece) {
            // draw ghost piece
            for(const [x,y] of ghost_piece.blocks()) {
                ctx.fillStyle = tetromino.color + "30"
                ctx.fillRect(board_x + x*BLOCK_SIZE + t, board_y + y*BLOCK_SIZE + t, BLOCK_SIZE - 2*t, BLOCK_SIZE - 2*t)
            }
        }
        // draw tetromino
        for(const [x,y] of tetromino.blocks()) {
            ctx.fillStyle = tetromino.color
            ctx.fillRect(board_x + x*BLOCK_SIZE + t, board_y + y*BLOCK_SIZE + t, BLOCK_SIZE - 2*t, BLOCK_SIZE - 2*t)
        }
    }
}

class Tile {
    constructor() {
        
    }
    initHover() {

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

    constructor() {
        this._solution = Solution.new(this._solution_pieces)
        this._boards.push([])
        this._boards[this._guess_num].push(this._current_board)
        this.addRow()
        
        this.initMouse()
    }

    initMouse(): void {
        document.addEventListener('mousemove', (e) => {
            this._mouse_x = e.clientX
            this._mouse_y = e.clientY
            this.drawSelect()
        })
    }

    addRow(): void {
        const row = document.createElement('div')
        row.classList.add('row')
        grid.appendChild(row)
        this._pieces.push([])

        for(const piece of this._solution_pieces) {
            this._pieces[this._guess_num].push(new Tetromino(piece.type))

            const tile = document.createElement('div')
            tile.classList.add('tile')

            const label = document.createElement('div')
            label.classList.add('tile-label')
            label.innerText = 'A4'

            const icon = document.createElement('canvas')
            icon.classList.add('tile-piece')
            
            icon.height = BLOCK_SIZE * 6 * 2/3
            icon.width = icon.height
            
            row.appendChild(tile)
            tile.appendChild(label)
            tile.appendChild(icon)
        }
        this._current_piece_index = 0
        this._current_piece = this._pieces[this._guess_num][this._current_piece_index]
        this.drawRows()
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
        this._current_piece.reset_y() //TODO Check spin or reset spin to avoid collision
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
        // this._pieces.push([])
        // this._pieces[this._guess_num-1].forEach((v) => {
        //     this._pieces[this._guess_num].push(new Tetromino(v.type))
        // })
        // this._current_piece_index = 0
        // this._current_piece = this._pieces[this._guess_num][this._current_piece_index]
        this.calculateHints()
        this.addRow()
        return true
    }

    private drawSelect(): void {
        const element = document.elementFromPoint(this._mouse_x, this._mouse_y)
        if(element?.className !== 'tile-piece' && element?.className !== 'tile') return this._current_board.draw(this._current_piece)
        const tile = element.className === 'tile-piece' ? element.parentElement : element
        if(!tile) return this._current_board.draw(this._current_piece)
        const row = tile.parentElement
        if(!row) return this._current_board.draw(this._current_piece)
        const guess = Array.from(grid.children).indexOf(row)
        const i = Array.from(row.children).indexOf(tile)
        if(guess < this._guess_num || (this._current_piece_index && i < this._current_piece_index)) {
            this._boards[guess][i+1].draw(null, '#333333')
            return
        }
        return this._current_board.draw(this._current_piece)
    }

    private drawTile(guess: number, i: number): void {
        const t = 2 // line thickness
        const piece = this._pieces[guess][i]
        const row = grid.children[guess]
        const tile = row.children[i]
        const canvas: HTMLCanvasElement = tile.querySelector('canvas') as HTMLCanvasElement
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        const label = tile.querySelector('.tile-label') as HTMLCanvasElement
        const GRID_SIZE = canvas.width

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = guess === this._guess_num || this._hints[guess][i] === Hint.Wrong ? '#080808' : this._hints[guess][i] === Hint.Half ? '#baa123' : '#19b342'
        ctx.fillStyle += 'E0'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if(piece === this._current_piece) {
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 5
            ctx.strokeRect(0, 0, canvas.width, canvas.height)
        }
        
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
            ctx.fillStyle = guess === this._guess_num ? piece.color : '#333333'
            ctx.fillRect(x * GRID_SIZE/6 + t, y * GRID_SIZE/6 + t, GRID_SIZE/6 - 2*t, GRID_SIZE/6 - 2*t)
        }
        // draw text
        const col_offset = 1 + (piece.rotation == 1 && piece.type != 4 ? 1 : 0) + (piece.type == 1 && piece.rotation % 2 == 1 ? 1 : 0) + (piece.type == 4 ? 1 : 0)
        var text = ''
        if(piece.previous_pos != null) {
            const prev_col_offset = 1 + (piece.previous_pos.rotation == 1 && piece.type != 4 ? 1 : 0) + (piece.type == 1 && piece.previous_pos.rotation % 2 == 1 ? 1 : 0) + (piece.type == 4 ? 1 : 0)
            text += Game.rotation_names[piece.previous_pos.rotation]+(piece.previous_pos.x+prev_col_offset)+'-'
        }
        text += Game.rotation_names[piece.rotation]+(piece.x+col_offset)
        label.textContent = text
    }

    private drawRows(): void {
        for(var guess = 0; guess <= this._guess_num; ++guess) {
            for(var i = 0; i < this._pieces[this._guess_num].length; ++i) {
                this.drawTile(guess, i)
            }
        }
    }

    draw(): void {
        this._current_board.draw(this._current_piece)
        this.drawRows()
        this.drawSelect()
    }
    update(): void {
        // do something
        this.draw()
    }
}
enum I {
    clockwise,
    counterclockwise,
    left,
    right,
    das_left,
    das_right,
    drop,
    down
}
class SolutionPiece {
    readonly type: Type
    readonly instructions: I[] | null
    readonly prerequisites: Type[] | null
    //add second constructor based on coordinates rather than instructions
    constructor(type: Type, instructions: I[] | null=null, prerequisites: Type[] | null=null) {
        this.type = type
        this.instructions = instructions
        this.prerequisites = prerequisites
    }
}
class Solution { //TODO: Precompile
    static new(solution_pieces: Tetromino[]): Board { //TODO: set number of pieces in solution
        const solution = Solution.answer5(solution_pieces)
        console.log('solution:', solution)
        console.log(solution_pieces
            )
        return solution
    }
    static add_piece(solution: Board, solution_pieces: Tetromino[], solution_piece: SolutionPiece): Board {
        const piece = new Tetromino(solution_piece.type)
        solution_pieces.push(piece)
        if(solution_piece.instructions) {
            for(const i of solution_piece.instructions) {
                switch(i) {
                    case I.clockwise: {
                        solution.rotatePiece(piece, Rotation.Clockwise)
                        break
                    }
                    case I.counterclockwise: {
                        solution.rotatePiece(piece, Rotation.CounterClockwise)
                        break
                    }
                    case I.left: {
                        solution.translatePiece(piece, -1, 0)
                        break
                    }
                    case I.right: {
                        solution.translatePiece(piece, 1, 0)
                        break
                    }
                    case I.das_left: {
                        solution.dasPiece(piece, -1, 0)
                        break
                    }
                    case I.das_right: {
                        solution.dasPiece(piece, 1, 0)
                        break
                    }
                    case I.drop: {
                        solution.dasPiece(piece)
                        break
                    }
                    case I.down: {
                        solution.translatePiece(piece, 0, 1)
                    }
                }
            }
        }
        solution.dasPiece(piece)
        return solution.addPiece(piece)
    }
    static shuffle_bag(bag: SolutionPiece[]): SolutionPiece[] {
        return bag.map(value => ({ value, sort: Math.random() }))
                  .sort((a, b) => a.sort - b.sort)
                  .map(({ value }) => value)
    }
    private static flip_type(type: Type): Type {
        if(type === Type.I || type === Type.O || type === Type.T) return type
        if(type === Type.S) return Type.Z
        if(type === Type.Z) return Type.S
        if(type === Type.J) return Type.L
        if(type === Type.L) return Type.J
        return type
    }
    private static flip_instruction(instruction: I): I {
        if(instruction === I.left) return I.right
        if(instruction === I.right) return I.left
        if(instruction === I.das_left) return I.das_right
        if(instruction === I.das_right) return I.das_left
        if(instruction === I.clockwise) return I.counterclockwise
        if(instruction === I.counterclockwise) return I.clockwise
        return instruction
    }
    private static flip_instructions(piece: SolutionPiece): I[] | null {
        if(piece.type === Type.O || piece.type === Type.I) {
            return piece.instructions ? piece.instructions.map<I>(Solution.flip_instruction) : null
        }
        if(!piece.instructions) return [I.right]
        const new_instructions = piece.instructions.map<I>(Solution.flip_instruction)
        if(new_instructions[0] === I.left) {
            new_instructions.shift()
        }
        else {
            new_instructions.unshift(I.right)
        }
        return new_instructions
    }
    private static flip_piece(piece: SolutionPiece): SolutionPiece {
        return new SolutionPiece(Solution.flip_type(piece.type),
            Solution.flip_instructions(piece),
            piece.prerequisites?.map<Type>(Solution.flip_type))
    }
    static flip_bag(bag: SolutionPiece[]): SolutionPiece[] {
        return bag.map<SolutionPiece>(Solution.flip_piece)
    }
    static get_new_solution(solution: Board, solution_pieces: Tetromino[], bag: SolutionPiece[], flip: boolean, order: boolean = false): Board {
        const new_bag: Tetromino[] = []
        // while(bag.length > 0) {
        const n = bag.length
        if(n > 7) {
            throw new Error('bag too big')
        }
        if(flip) {
            bag = Solution.flip_bag(bag)
        }
        if(order) {
            for(var r of bag) {
                solution = Solution.add_piece(solution, solution_pieces, r)
            }
            return solution
        }
        for(var _ = 0; _ < n; ++_) {
            bag = Solution.shuffle_bag(bag)
            for(var i = 0; i < bag.length; ++i) {
                const s = bag[i]
                if(s.prerequisites === null) {
                    bag.splice(i,1)
                    solution = Solution.add_piece(solution, new_bag, s)
                    break
                }
                var prerequisite = true
                for(var p of s.prerequisites) {
                    if(p === s.type) {
                        prerequisite = false
                        break
                    }
                    var match = false
                    for(var t of new_bag) {
                        if(t.type === p) {
                            match = true
                            break
                        }
                    }
                    if(!match) {
                        prerequisite = false
                        break
                    }
                }
                if(!prerequisite && bag.length > 1) {
                    continue
                }
                bag.splice(i,1)
                solution = Solution.add_piece(solution, new_bag, s)
                break
            }
        }
        solution_pieces.push(...new_bag)
        return solution
    }
    static answer1(solution_pieces: Tetromino[]): Board { // TKI
        const flip = Math.random() < 0.5
        var solution: Board = new Board()
        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.I))
        bag.push(new SolutionPiece(Type.S, [I.right,I.right,I.clockwise], [Type.I]))
        bag.push(new SolutionPiece(Type.Z, null, [Type.I]))
        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.das_left]))
        bag.push(new SolutionPiece(Type.O, [I.das_right]))
        bag.push(new SolutionPiece(Type.J, [I.das_right], [Type.O,Type.S]))
        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise,I.drop,I.clockwise], [Type.T]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        return solution
    }
    static answer2(solution_pieces: Tetromino[]): Board { // DT Cannon
        const flip = Math.random() < 0.5
        var solution: Board = new Board()
        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.L, [I.das_left]))
        bag.push(new SolutionPiece(Type.O, [I.das_right]))
        bag.push(new SolutionPiece(Type.J, [I.right]))
        bag.push(new SolutionPiece(Type.S, [I.das_left], [Type.L]))
        bag.push(new SolutionPiece(Type.I, [I.counterclockwise, I.left]))
        bag.push(new SolutionPiece(Type.Z, [I.right], [Type.J]))
        bag.push(new SolutionPiece(Type.T, [I.right], [Type.Z]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        return solution
    }
    static answer3(solution_pieces: Tetromino[]): Board { // DT Cannon extended
        const flip = Math.random() < 0.5
        var solution: Board = new Board()
        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.O, [I.das_left]))
        bag.push(new SolutionPiece(Type.L))
        bag.push(new SolutionPiece(Type.I, [I.right,I.clockwise]))
        bag.push(new SolutionPiece(Type.S, null, [Type.L]))
        bag.push(new SolutionPiece(Type.T, null, [Type.S]))
        bag.push(new SolutionPiece(Type.J, [I.das_right]))
        bag.push(new SolutionPiece(Type.Z, [I.das_right], [Type.J]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)

        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left]))
        bag.push(new SolutionPiece(Type.Z, [I.right]))
        bag.push(new SolutionPiece(Type.O, [I.das_right, I.left]))
        bag.push(new SolutionPiece(Type.L, [I.counterclockwise,I.left]))
        bag.push(new SolutionPiece(Type.I, [I.clockwise,I.das_right]))
        bag.push(new SolutionPiece(Type.S, [I.das_right], [Type.O,Type.I]))
        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left,I.drop,I.counterclockwise,I.counterclockwise,I.down,I.counterclockwise], [Type.I,Type.L,Type.J]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        return solution
    }
    static answer4(solution_pieces: Tetromino[]): Board { // DT Cannon Perfect Clear
        const flip = Math.random() < 0.5
        var solution: Board = new Board()
        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.O, [I.das_left]))
        bag.push(new SolutionPiece(Type.L))
        bag.push(new SolutionPiece(Type.I, [I.right,I.clockwise]))
        bag.push(new SolutionPiece(Type.S, null, [Type.L]))
        bag.push(new SolutionPiece(Type.T, null, [Type.S]))
        bag.push(new SolutionPiece(Type.J, [I.das_right]))
        bag.push(new SolutionPiece(Type.Z, [I.das_right], [Type.J]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)

        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left]))
        bag.push(new SolutionPiece(Type.Z, [I.right]))
        bag.push(new SolutionPiece(Type.O, [I.das_right, I.left]))
        bag.push(new SolutionPiece(Type.L, [I.counterclockwise,I.left]))
        bag.push(new SolutionPiece(Type.I, [I.clockwise,I.das_right]))
        bag.push(new SolutionPiece(Type.S, [I.das_right], [Type.O,Type.I]))
        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left,I.drop,I.counterclockwise,I.counterclockwise,I.down,I.counterclockwise], [Type.I,Type.L,Type.J]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)

        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.das_right]))
        bag.push(new SolutionPiece(Type.O, [I.das_right], [Type.L]))
        bag.push(new SolutionPiece(Type.S, [I.right,I.clockwise]))
        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left,I.drop,I.counterclockwise,I.counterclockwise]))
        bag.push(new SolutionPiece(Type.J, [I.clockwise], [Type.S]))
        bag.push(new SolutionPiece(Type.Z, [I.clockwise,I.right,I.right], [Type.S,Type.L]))
        bag.push(new SolutionPiece(Type.I, null, [Type.J,Type.Z]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        
        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.S, [I.das_left,I.clockwise,I.drop,I.right]))
        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left,I.drop,I.counterclockwise]))
        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.das_left,I.drop,I.right], [Type.S,Type.T]))
        bag.push(new SolutionPiece(Type.I, [I.counterclockwise,I.das_left], [Type.I]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        return solution
    }
    private static PCO_block(bag: SolutionPiece[], position: number): void {
        var temp: SolutionPiece[] = []
        switch(position % 4) {
            case 0: 
            case 3: {
                const variation: number = Math.floor(Math.random() * 8)
                switch(variation) {
                    case 0: {
                        temp.push(new SolutionPiece(Type.I, [I.counterclockwise,I.das_left]))
                        temp.push(new SolutionPiece(Type.L, [I.das_left,I.right]))
                        temp.push(new SolutionPiece(Type.O, [I.das_left,I.right], [Type.L]))
                        temp.push(new SolutionPiece(Type.J, [I.clockwise,I.clockwise,I.das_left,I.right], [Type.O]))
                        break
                    } case 1: {
                        temp.push(new SolutionPiece(Type.I, [I.counterclockwise,I.das_left]))
                        temp.push(new SolutionPiece(Type.J, [I.das_left,I.right]))
                        temp.push(new SolutionPiece(Type.O, [I.left,I.left], [Type.J]))
                        temp.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.das_left,I.right], [Type.O]))
                        break
                    } case 2: {
                        temp.push(new SolutionPiece(Type.I, [I.das_left]))
                        temp.push(new SolutionPiece(Type.L, [I.clockwise,I.das_left], [Type.I]))
                        temp.push(new SolutionPiece(Type.J, [I.counterclockwise,I.left], [Type.I]))
                        temp.push(new SolutionPiece(Type.O, [I.das_left,I.right], [Type.L,Type.J]))
                        break
                    } case 3: {
                        temp.push(new SolutionPiece(Type.I, [I.das_left]))
                        temp.push(new SolutionPiece(Type.O, [I.das_left,I.right], [Type.I]))
                        temp.push(new SolutionPiece(Type.L, [I.counterclockwise,I.left], [Type.O]))
                        temp.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left], [Type.O]))
                        break
                    } case 4: {
                        temp.push(new SolutionPiece(Type.I, [I.counterclockwise,I.left]))
                        temp.push(new SolutionPiece(Type.L, [I.das_left]))
                        temp.push(new SolutionPiece(Type.O, [I.das_left], [Type.L]))
                        temp.push(new SolutionPiece(Type.J, [I.clockwise,I.clockwise,I.das_left], [Type.O]))
                        break
                    } case 5: {
                        temp.push(new SolutionPiece(Type.I, [I.counterclockwise,I.left]))
                        temp.push(new SolutionPiece(Type.J, [I.das_left]))
                        temp.push(new SolutionPiece(Type.O, [I.das_left,I.right],[Type.J]))
                        temp.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.das_left],[Type.O]))
                        break
                    } case 6: {
                        temp.push(new SolutionPiece(Type.L, [I.clockwise,I.das_left]))
                        temp.push(new SolutionPiece(Type.J, [I.counterclockwise,I.left]))
                        temp.push(new SolutionPiece(Type.O, [I.das_left,I.right], [Type.L,Type.J]))
                        temp.push(new SolutionPiece(Type.I, [I.das_left], [Type.O]))
                        break
                    } case 7: {
                        temp.push(new SolutionPiece(Type.O, [I.das_left,I.right]))
                        temp.push(new SolutionPiece(Type.L, [I.counterclockwise,I.left], [Type.O]))
                        temp.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left], [Type.O]))
                        temp.push(new SolutionPiece(Type.I, [I.das_left], [Type.L,Type.J]))
                        break
                    }
                }
                if(position === 0) {
                    temp = Solution.flip_bag(temp)
                }
                break
            }
            case 1:
            case 2: {
                const variation: number = Math.floor(Math.random() * 2)
                switch(variation) {
                    case 0: {
                        temp.push(new SolutionPiece(Type.I, [I.clockwise,I.das_right]))
                        temp.push(new SolutionPiece(Type.L, [I.das_left]))
                        temp.push(new SolutionPiece(Type.O, [I.das_left],[Type.L]))
                        temp.push(new SolutionPiece(Type.J, [I.clockwise,I.clockwise,I.das_left],[Type.O]))
                        break
                    } case 1: {
                        temp.push(new SolutionPiece(Type.I, [I.clockwise,I.das_right]))
                        temp.push(new SolutionPiece(Type.J, [I.das_left]))
                        temp.push(new SolutionPiece(Type.O, [I.das_left,I.right],[Type.J]))
                        temp.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.das_left],[Type.O]))
                        break
                    }
                }
                if(position === 1) {
                    temp = Solution.flip_bag(temp)
                }
                break
            }
        }
        bag.push(...temp)
    }
    private static PCO_triangle(bag: SolutionPiece[], position: number): void {
        switch(position % 4) {
            case 0: {
                bag.push(new SolutionPiece(Type.Z, [I.left]))
                bag.push(new SolutionPiece(Type.T, [I.counterclockwise,I.right], [Type.Z]))
                bag.push(new SolutionPiece(Type.S, null, [Type.T]))
                break
            } case 1: {
                bag.push(new SolutionPiece(Type.Z))
                bag.push(new SolutionPiece(Type.T, [I.counterclockwise,I.right,I.right], [Type.Z]))
                bag.push(new SolutionPiece(Type.S, [I.right], [Type.T]))
                break
            } case 2: {
                bag.push(new SolutionPiece(Type.Z, [I.right,I.right]))
                bag.push(new SolutionPiece(Type.T, [I.das_right,I.counterclockwise], [Type.Z]))
                bag.push(new SolutionPiece(Type.S, [I.das_right,I.left], [Type.T]))
                break
            } case 3: {
                bag.push(new SolutionPiece(Type.Z, [I.das_right,I.left]))
                bag.push(new SolutionPiece(Type.T, [I.counterclockwise,I.das_right], [Type.Z]))
                bag.push(new SolutionPiece(Type.S, [I.das_right], [Type.T]))
                break
            }
        }
    }
    private static PCO_fill(bag: SolutionPiece[], position: number): void {
        const variation: number = Math.floor(Math.random() * 15)
        switch(variation) {
            case 0: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.das_left,I.drop,I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.counterclockwise,I.das_left], [Type.L]))
                        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise,I.clockwise,I.right], [Type.L]))
                        break
                    } case 1: {
                        bag.push(new SolutionPiece(Type.L, [I.das_left,I.clockwise,I.drop,I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left,I.counterclockwise], [Type.L]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.left], [Type.L]))
                        break
                    } case 2: {
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.left,I.drop,I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.counterclockwise,I.left], [Type.L]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.right], [Type.L]))
                        break
                    } case 3: {
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.drop,I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.counterclockwise], [Type.L]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.right,I.right], [Type.L]))
                        break
                    }
                }
                break
            }
            case 1: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.das_left]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left,I.right,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left,I.right]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.left,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise]))
                        bag.push(new SolutionPiece(Type.I))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.right]))
                        break
                    }
                }
                break
            }
            case 2: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.counterclockwise,I.das_left], [Type.J]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.das_left,I.right], [Type.S]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left,I.right,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.das_left,I.clockwise], [Type.J]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.left], [Type.S]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.left,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.counterclockwise], [Type.J]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.right], [Type.S]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise], [Type.J]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.right,I.right], [Type.S]))
                        break
                    }
                }
                break
            }
            case 3: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left]))
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.das_left], [Type.T]))
                        break
                    } case 1: {
                        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.das_left,I.right], [Type.T]))
                        break
                    } case 2: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.left,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.I))
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise], [Type.T]))
                        break
                    } case 3: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.I, [I.right]))
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.right], [Type.T]))
                        break
                    }
                }
                break
            }
            case 4: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left], [Type.T]))
                        bag.push(new SolutionPiece(Type.S, [I.das_left,I.clockwise,I.drop,I.clockwise,I.right], [Type.T]))
                        break
                    } case 1: {
                        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.J, [I.das_left,I.clockwise], [Type.T]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.left,I.left,I.drop,I.clockwise,I.right], [Type.T]))
                        break
                    } case 2: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.left,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.left], [Type.T]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.drop,I.clockwise,I.right], [Type.T]))
                        break
                    } case 3: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise], [Type.T]))
                        bag.push(new SolutionPiece(Type.S, [I.right,I.clockwise,I.drop,I.clockwise,I.right], [Type.T]))
                        break
                    }
                }
                break
            }
            case 5: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left]))
                        bag.push(new SolutionPiece(Type.L, [I.das_left,I.counterclockwise], [Type.T]))
                        bag.push(new SolutionPiece(Type.J, [I.das_left,I.clockwise,I.right], [Type.T]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise]))
                        bag.push(new SolutionPiece(Type.L, [I.das_left,I.counterclockwise,I.right], [Type.T]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.left], [Type.T]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.left]))
                        bag.push(new SolutionPiece(Type.L, [I.counterclockwise], [Type.T]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.right], [Type.T]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise]))
                        bag.push(new SolutionPiece(Type.L, [I.counterclockwise,I.right], [Type.T]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.right,I.right], [Type.T]))
                        break
                    }
                }
                break
            }
            case 6: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left]))
                        bag.push(new SolutionPiece(Type.S, [I.das_left,I.right], [Type.T]))
                        bag.push(new SolutionPiece(Type.Z, [I.das_left,I.right,I.counterclockwise,I.drop,I.counterclockwise], [Type.S]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.left], [Type.T]))
                        bag.push(new SolutionPiece(Type.Z, [I.left,I.counterclockwise,I.drop,I.counterclockwise], [Type.S]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.left]))
                        bag.push(new SolutionPiece(Type.S, [I.right], [Type.T]))
                        bag.push(new SolutionPiece(Type.Z, [I.right,I.counterclockwise,I.drop,I.counterclockwise], [Type.S]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.right,I.right], [Type.T]))
                        bag.push(new SolutionPiece(Type.Z, [I.right,I.right,I.counterclockwise,I.drop,I.counterclockwise], [Type.S]))
                        break
                    }
                }
                break
            }
            case 7: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.Z, [I.das_left,I.right,I.counterclockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.das_left,I.clockwise,I.drop,I.clockwise,I.right], [Type.Z]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left], [Type.Z]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.Z, [I.left,I.counterclockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.left,I.left,I.drop,I.clockwise,I.right], [Type.Z]))
                        bag.push(new SolutionPiece(Type.J, [I.das_left,I.clockwise], [Type.Z]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.Z, [I.right,I.counterclockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.drop,I.clockwise,I.right], [Type.Z]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.left], [Type.Z]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.Z, [I.right,I.right,I.counterclockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.right,I.clockwise,I.drop,I.clockwise,I.right], [Type.Z]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise], [Type.Z]))
                        break
                    }
                }
                break
            }
            case 8: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.J, [I.das_left]))
                        bag.push(new SolutionPiece(Type.Z, [I.das_left,I.drop,I.counterclockwise,I.counterclockwise,I.counterclockwise], [Type.J]))
                        bag.push(new SolutionPiece(Type.S, [I.das_left,I.clockwise,I.drop,I.clockwise,I.right], [Type.Z]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.J, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.Z, [I.das_left,I.right,I.drop,I.counterclockwise,I.counterclockwise,I.counterclockwise], [Type.J]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.left,I.left,I.drop,I.clockwise,I.right], [Type.Z]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.J))
                        bag.push(new SolutionPiece(Type.Z, [I.drop,I.counterclockwise,I.counterclockwise,I.counterclockwise], [Type.J]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.drop,I.clockwise,I.right], [Type.Z]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.J, [I.right]))
                        bag.push(new SolutionPiece(Type.Z, [I.right,I.drop,I.counterclockwise,I.counterclockwise,I.counterclockwise], [Type.J]))
                        bag.push(new SolutionPiece(Type.S, [I.right,I.clockwise,I.drop,I.clockwise,I.right], [Type.Z]))
                        break
                    }
                }
                break
            }
            case 9: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_left]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left]))
                        bag.push(new SolutionPiece(Type.O, [I.das_left,I.right], [Type.T]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.O, [I.left, I.left], [Type.T]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.left]))
                        bag.push(new SolutionPiece(Type.I))
                        bag.push(new SolutionPiece(Type.O, null, [Type.T]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.T, [I.clockwise]))
                        bag.push(new SolutionPiece(Type.I, [I.right]))
                        bag.push(new SolutionPiece(Type.O, [I.right], [Type.T]))
                        break
                    }
                }
                break
            }
            case 10: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.I, [I.clockwise,I.das_left]))
                        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.das_left,I.clockwise,I.drop,I.clockwise,I.right], [Type.I,Type.T]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.I, [I.das_left,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.left,I.left]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.left,I.left,I.drop,I.clockwise,I.right], [Type.I,Type.T]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.I, [I.counterclockwise,I.left]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise]))
                        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.drop,I.clockwise,I.right], [Type.I,Type.T]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.I, [I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.right]))
                        bag.push(new SolutionPiece(Type.S, [I.right,I.clockwise,I.drop,I.clockwise,I.right], [Type.I,Type.T]))
                        break
                    }
                }
                break
            }
            case 11: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.O, [I.das_left]))
                        bag.push(new SolutionPiece(Type.J, [I.das_left], [Type.O]))
                        bag.push(new SolutionPiece(Type.T, [I.das_left,I.clockwise,I.clockwise,I.right], [Type.O,Type.J]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.O, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.J, [I.das_left,I.right], [Type.O]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.left], [Type.O,Type.J]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.O, [I.left]))
                        bag.push(new SolutionPiece(Type.J, null, [Type.O]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.right], [Type.O,Type.J]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.O))
                        bag.push(new SolutionPiece(Type.J, [I.right], [Type.O]))
                        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.clockwise,I.right,I.right], [Type.O,Type.J]))
                        break
                    }
                }
                break
            }
            case 12: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.Z, [I.das_left,I.right,I.counterclockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left]))
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.das_left], [Type.Z]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.Z, [I.left,I.counterclockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.das_left,I.right], [Type.Z]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.Z, [I.right,I.counterclockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.I))
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise], [Type.Z]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.Z, [I.right,I.right,I.counterclockwise,I.drop,I.counterclockwise]))
                        bag.push(new SolutionPiece(Type.I, [I.right]))
                        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.right], [Type.Z]))
                        break
                    }
                }
                break
            }
            case 13: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.O, [I.das_left]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.clockwise,I.das_left], [Type.O]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.O, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.clockwise,I.das_left,I.right], [Type.O]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.O, [I.left]))
                        bag.push(new SolutionPiece(Type.I))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.clockwise], [Type.O]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.O))
                        bag.push(new SolutionPiece(Type.I, [I.right]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.clockwise,I.right], [Type.O]))
                        break
                    }
                }
                break
            }
            case 14: {
                switch(position % 4) {
                    case 0: {
                        bag.push(new SolutionPiece(Type.S, [I.das_left]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left,I.drop,I.counterclockwise], [Type.S]))
                        break
                    }
                    case 1: {
                        bag.push(new SolutionPiece(Type.S, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.das_left,I.right]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.das_left,I.right,I.drop,I.counterclockwise], [Type.S]))
                        break
                    }
                    case 2: {
                        bag.push(new SolutionPiece(Type.S))
                        bag.push(new SolutionPiece(Type.I))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.left,I.drop,I.counterclockwise], [Type.S]))
                        break
                    }
                    case 3: {
                        bag.push(new SolutionPiece(Type.S, [I.right]))
                        bag.push(new SolutionPiece(Type.I, [I.right]))
                        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.drop,I.counterclockwise], [Type.S]))
                        break
                    }
                }
                break
            }
        }
    }
    private static PCO2(bag: SolutionPiece[], sum: number) {
        //I=1, J=2, L=3, O=4, S=5, T=6, Z=7
        var temp: SolutionPiece[] = []
        switch(sum) {
            case 124: { // I J O - L S T Z - T1
                temp.push(new SolutionPiece(Type.L, [I.das_right]))
                temp.push(new SolutionPiece(Type.S, [I.right,I.right], [Type.L]))
                temp.push(new SolutionPiece(Type.T, [I.clockwise], [Type.S]))
                temp.push(new SolutionPiece(Type.Z, [I.clockwise,I.das_right], [Type.L]))
                break
            }
            case 125: { // I J S - L O T Z - T3B
                temp.push(new SolutionPiece(Type.L, [I.das_left,I.clockwise,I.right]))
                temp.push(new SolutionPiece(Type.O, [I.das_left]))
                temp.push(new SolutionPiece(Type.T, [I.right]))
                temp.push(new SolutionPiece(Type.Z, [I.das_right,I.left], [Type.T]))
                break
            }
            case 126:   // I J T - L O S Z - W2B
            case 136: { // I L T - J O S Z - W2
                temp.push(new SolutionPiece(Type.J, [I.das_right,I.counterclockwise,I.left]))
                temp.push(new SolutionPiece(Type.O, [I.das_right]))
                temp.push(new SolutionPiece(Type.S, [I.right], [Type.J]))
                temp.push(new SolutionPiece(Type.Z, [I.counterclockwise], [Type.S]))
                if(sum == 126) {
                    temp = Solution.flip_bag(temp)
                }
                break
            }
            case 137: { // I L Z - J O S T - T3
                temp.push(new SolutionPiece(Type.J, [I.das_right,I.counterclockwise,I.left]))
                temp.push(new SolutionPiece(Type.O, [I.das_right]))
                temp.push(new SolutionPiece(Type.S, [I.das_left,I.right], [Type.T]))
                temp.push(new SolutionPiece(Type.T))
                break
            }
            case 146: { // I O T - J L S Z - W3
                temp.push(new SolutionPiece(Type.J, [I.counterclockwise,I.das_right]))
                temp.push(new SolutionPiece(Type.L, [I.left]))
                temp.push(new SolutionPiece(Type.S, [I.das_right,I.left], [Type.J]))
                temp.push(new SolutionPiece(Type.Z, [I.clockwise,I.right], [Type.S]))
                break
            }
            case 156: { // I S T - J L O Z - W1
                temp.push(new SolutionPiece(Type.J, [I.right]))
                temp.push(new SolutionPiece(Type.L, [I.das_right,I.counterclockwise,I.left], [Type.Z]))
                temp.push(new SolutionPiece(Type.O, [I.das_right]))
                temp.push(new SolutionPiece(Type.Z, [I.right], [Type.J]))
                break
            }
            case 236: { // J L T - I O S Z - W5
                temp.push(new SolutionPiece(Type.I, [I.counterclockwise,I.das_left]))
                temp.push(new SolutionPiece(Type.O, [I.das_left,I.right]))
                temp.push(new SolutionPiece(Type.S, [I.right]))
                temp.push(new SolutionPiece(Type.Z, [I.counterclockwise], [Type.S]))
                break
            }
            case 246: { // J O T - I L S Z - W2B
                temp.push(new SolutionPiece(Type.I, [I.das_left]))
                temp.push(new SolutionPiece(Type.L, [I.das_left]))
                temp.push(new SolutionPiece(Type.S, [I.clockwise,I.right], [Type.Z]))
                temp.push(new SolutionPiece(Type.Z, null, [Type.I]))
                break
            }
            case 256: { // J S T - I L O Z - W4
                temp.push(new SolutionPiece(Type.I, [I.clockwise,I.das_right]))
                temp.push(new SolutionPiece(Type.L, [I.das_right,I.left]))
                temp.push(new SolutionPiece(Type.O))
                temp.push(new SolutionPiece(Type.Z, [I.right,I.right], [Type.L]))
                break
            }
            case 257: { // J S Z - I L O T - O2B
                temp.push(new SolutionPiece(Type.I, [I.left]))
                temp.push(new SolutionPiece(Type.L, [I.left], [Type.I]))
                temp.push(new SolutionPiece(Type.O, [I.das_left]))
                temp.push(new SolutionPiece(Type.T, [I.das_right,I.left]))
                break
            }
            case 567: { // S T Z - I J L O - W1
                temp.push(new SolutionPiece(Type.I, [I.das_right]))
                temp.push(new SolutionPiece(Type.J, [I.das_right], [Type.I]))
                temp.push(new SolutionPiece(Type.L, [I.clockwise]))
                temp.push(new SolutionPiece(Type.O, [I.right], [Type.I,Type.L]))
                break
            }
            default: {
                console.log('NO CASE')
            }
        }
        bag.push(...temp)
    }
    static answer5(solution_pieces: Tetromino[]): Board { // PCO
        const position: number = Math.floor(Math.random() * 4) // const position = 3
        // const flip = Math.random() < 0.5
        const flip = false
        var solution: Board = new Board()
        var bag: SolutionPiece[] = []
        Solution.PCO_block(bag, position)
        Solution.PCO_triangle(bag, position)
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)

        var bag: SolutionPiece[] = []
        Solution.PCO_fill(bag, position)
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)

        const sum = bag.sort((a,b) => a.type - b.type).reduce((a,b) => a*10+b.type,0)
        console.log('sum:',sum)
        var bag: SolutionPiece[] = []
        Solution.PCO2(bag, sum)
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        return solution
    }
    static answer6(solution_pieces: Tetromino[]): Board { // Albatross
        const flip = Math.random() < 0.5
        var solution: Board = new Board()
        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.J, [I.clockwise,I.clockwise,I.left]))
        bag.push(new SolutionPiece(Type.O, [I.right]))
        bag.push(new SolutionPiece(Type.I, [I.counterclockwise, I.das_left]))
        bag.push(new SolutionPiece(Type.S, [I.right]))
        bag.push(new SolutionPiece(Type.Z, [I.clockwise,I.das_right]))
        bag.push(new SolutionPiece(Type.L, [I.clockwise,I.clockwise,I.left,I.left]))
        bag.push(new SolutionPiece(Type.T, [I.clockwise,I.das_right,I.left,I.drop,I.clockwise]))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        return solution
    }
    static answer7(solution_pieces: Tetromino[]): Board { // test
        const flip = Math.random() < 0.5
        var solution: Board = new Board()
        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.O, [I.right]))
        bag.push(new SolutionPiece(Type.L, [I.right,I.right]))
        bag.push(new SolutionPiece(Type.I))
        bag.push(new SolutionPiece(Type.S, [I.clockwise,I.das_right,I.drop,I.clockwise]))
        bag.push(new SolutionPiece(Type.T))
        bag.push(new SolutionPiece(Type.J))
        bag.push(new SolutionPiece(Type.Z))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        return solution
    }
    static answer0(solution_pieces: Tetromino[]): Board {
        const flip = Math.random() < 0.5
        var solution: Board = new Board()
        var bag: SolutionPiece[] = []
        bag.push(new SolutionPiece(Type.O))
        bag.push(new SolutionPiece(Type.L))
        bag.push(new SolutionPiece(Type.I))
        bag.push(new SolutionPiece(Type.S))
        bag.push(new SolutionPiece(Type.T))
        bag.push(new SolutionPiece(Type.J))
        bag.push(new SolutionPiece(Type.Z))
        solution = Solution.get_new_solution(solution, solution_pieces, bag, flip)
        return solution
    }
}

const canvas: HTMLCanvasElement = document.getElementById('board') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
const grid: HTMLDivElement = document.getElementById('grid') as HTMLDivElement

const game = new Game()
game.draw()


// function updateWindow() {
//     // canvas.width = window.innerWidth
//     // canvas.height = window.innerHeight
//     // game.draw()
    
// }

// updateWindow()
// window.addEventListener('resize', updateWindow)

function keypressed(key: string) {
    switch(key) {
        case 'arrowup':
        case "w": {
            game.hardDropPiece()
            break
        }
        case 'arrowleft':
        case "a": {
            if(pressed_keys.has('d') || pressed_keys.has('arrowright')) break
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
            if(pressed_keys.has('a') || pressed_keys.has('arrowleft')) break
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
}

const pressed_keys = new Map<string, number>()
window.addEventListener('keydown', (event) => {
    if (event.repeat) return
    const key = event.key.toLowerCase()
    keypressed(key)
    var wait_time = 200
    var repeat_interval = 30
    switch(key) {
        case 's': {
            repeat_interval = 100
            wait_time = 50
        }
        case 'a':
        case 'd':
        case 'arrowleft':
        case 'arrowright': {
            break
        }
        default: {
            return
        }
    }
    clearTimeout(pressed_keys.get(key))
    clearInterval(pressed_keys.get(key))
    pressed_keys.set(key,setTimeout(() => {
        clearTimeout(pressed_keys.get(key))
        clearInterval(pressed_keys.get(key))
        pressed_keys.set(key,setInterval(keypressed,repeat_interval,key))
    },wait_time))
})

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase()
    clearTimeout(pressed_keys.get(key))
    clearInterval(pressed_keys.get(key))
    pressed_keys.delete(key)
    // console.log(pressed_keys)
})

function clearKeys() {
    pressed_keys.forEach((v) => {
        clearTimeout(v)
        clearInterval(v)
    })
    pressed_keys.clear()
}

window.addEventListener('focus', () => {
    clearKeys()
})

document.addEventListener('visibilitychange', () => {
    clearKeys()
})