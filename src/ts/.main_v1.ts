const BLOCK_SIZE = 30

enum Rotation {
    None = 0,
    Clockwise = 1,
    CounterClockwise = 3
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
    readonly type: number //1-7
    private _rotation: number = 0 // 0-3
    private _x: number = 3
    private _y: number = 0
    
    constructor(type: number) {
        if(!(Number.isInteger(type) && type >= 1 && type <= 7)) {
            throw new RangeError("type must be an integer from 1 to 7")
        }
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
    get color(): string {
        return Tetromino.colors[this.type-1]
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
        this._rotation = (this.rotation + rotation) % 4
    }
    translate(x_translation: number, y_translation: number): void {
        this._x += x_translation
        this._y += y_translation
    }
}

class Board {
    static BOARD_WIDTH = 10
    static BOARD_HEIGHT = 22
    _board_x: number = 0
    _board_y: number = 0

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

    addPiece(tetromino: Tetromino): Board | null {
        if(!this.validPosition(tetromino)) return null
        const new_board = new Board()
        // Deep copy board
        for(var y = 0; y < this._board.length; ++y) {
            for(var x = 0; x < this._board[0].length; ++x) {
                new_board._board[y][x] = this._board[y][x]
            }
        }
        // Add tetromino blocks
        for(const [x,y] of tetromino.blocks()) {
            new_board._board[y][x] = tetromino.type
        }
        new_board.checkLineClears()
        return new_board
    }

    getGhostPiece(tetromino: Tetromino): Tetromino | null {
        if(!this.validPosition(tetromino)) return null
        const ghost_piece = tetromino.copy()

        while(this.validPosition(ghost_piece, Rotation.None, 0, 1)) {
            ghost_piece.translate(0, 1)
        }
        return ghost_piece
    }

    draw(tetromino: Tetromino | null): void {
        this._board_x = (canvas.width - BLOCK_SIZE * Board.BOARD_WIDTH)/2
        this._board_y = 10
        ctx.beginPath()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2
        ctx.strokeRect(this._board_x, this._board_y + BLOCK_SIZE * 2, BLOCK_SIZE * Board.BOARD_WIDTH, BLOCK_SIZE * (Board.BOARD_HEIGHT-2))
        ctx.closePath()
        for(var y = 0; y < this._board.length; ++y) {
            for(var x = 0; x < this._board[0].length; ++x) {
                if(this._board[y][x] === 0) continue
                ctx.fillStyle = Tetromino.colors[this._board[y][x]-1]
                ctx.fillRect(this._board_x + x * BLOCK_SIZE, this._board_y + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
            }
        }
        if(!tetromino)  return
        const ghost_piece = this.getGhostPiece(tetromino)
        if(ghost_piece) {
            // draw ghost piece
            for(const [x,y] of ghost_piece.blocks()) {
                ctx.fillStyle = tetromino.color + "50"
                ctx.fillRect(this._board_x + x * BLOCK_SIZE, this._board_y + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
            }
        }
        // draw tetromino
        for(const [x,y] of tetromino.blocks()) {
            ctx.fillStyle = tetromino.color
            ctx.fillRect(this._board_x + x * BLOCK_SIZE, this._board_y + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
        }
        
    }
}

class Game {
    private _boards: Board[] = []
    private _current_board: Board = new Board()
    private _pieces: Tetromino[] = []
    private _current_piece: Tetromino | null = null
    private _current_piece_index: number | null = null

    constructor() {
        this._boards.push(this._current_board)
        this._pieces = [1,2,3,4,5,6,7]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => new Tetromino(value))
        this._current_piece_index = 0
        this._current_piece = this._pieces[this._current_piece_index]
    }

    startNewBag(): void {
        this._pieces = this._pieces.concat([1,2,3,4,5,6,7].map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => new Tetromino(value)))
    }

    translatePiece(x_translation: number,
    y_translation: number): void {
        if(!this._current_piece) return
        if(this._current_board.validPosition(this._current_piece, Rotation.None, x_translation, y_translation)) {
            this._current_piece.translate(x_translation, y_translation)
        }
    }
    rotatePiece(rotation: Rotation): void {
        if(!this._current_piece) return
        if(this._current_board.validPosition(this._current_piece,rotation)) {
            this._current_piece.rotate(rotation)
            return
        }
        const tests: number[][] = this._current_piece.rotationTests(rotation)
        for(const test of tests) {
            const x_translation: number = test[0]
            const y_translation: number = test[1] * -1
            if(this._current_board.validPosition(this._current_piece, rotation, x_translation, y_translation)) {
                this._current_piece.rotate(rotation)
                this._current_piece.translate(x_translation, y_translation)
                return
            }
        }
    }
    addPiece(): void {
        if(!this._current_piece) return
        const new_board = this._current_board.addPiece(this._current_piece)
        if(!new_board) return // Error, do nothing
        this._current_board = new_board
        this._boards.push(this._current_board)
        if(this._current_piece_index === null || ++this._current_piece_index === this._pieces.length) {
            this._current_piece_index = this._pieces.length
            this.startNewBag()
        }
        this._current_piece = this._pieces[this._current_piece_index]
        this.checkGameOver()
        
    }
    hardDropPiece(): void {
        if(!this._current_piece) return
        while(this._current_board.validPosition(this._current_piece, Rotation.None, 0, 1)) {
            this._current_piece.translate(0, 1)
        }
        this.addPiece()
    }

    checkGameOver(): void {
        if(!this._current_piece) return
        if(this._current_board.validPosition(this._current_piece)) return
        this._current_piece = null
    }

    draw(): void {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this._current_board.draw(this._current_piece)
    }
    update(): void {
        // do something
        this.draw()
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
        case "w": {
            game.hardDropPiece()
            break
        }
        case "a": {
            game.translatePiece(-1,0)
            break
        }
        case "s": {
            game.translatePiece(0,1)
            break
        }
        case "d": {
            game.translatePiece(1,0)
            break
        }
        case "j": {
            game.rotatePiece(Rotation.CounterClockwise)
            break
        }
        case "k": {
            game.rotatePiece(Rotation.Clockwise)
            break
        }
        default: {
            return
        }
    }
    game.update()
})