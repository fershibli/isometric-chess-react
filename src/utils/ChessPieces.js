const filterValidMoves = (moves) => {
    return moves.filter(
        ({ row, col }) => row >= 0 && row < 8 && col >= 0 && col < 8
    );
};

export const KING = {
    dark: "\u265A",
    light: "\u2654",
    size: 1.7,
    getMoves: (row, col) => {
        const possibleMoves = [
            { row: row + 1, col },
            { row: row - 1, col },
            { row, col: col + 1 },
            { row, col: col - 1 },
            { row: row + 1, col: col + 1 },
            { row: row - 1, col: col - 1 },
            { row: row + 1, col: col - 1 },
            { row: row - 1, col: col + 1 },
        ];

        return filterValidMoves(possibleMoves);
    },
};

export const QUEEN = {
    dark: "\u265B",
    light: "\u2655",
    size: 1.7,
    getMoves: (row, col) => {
        const bishopMoves = BISHOP.getMoves(row, col);
        const rookMoves = ROOK.getMoves(row, col);
        const possibleMoves = [...bishopMoves, ...rookMoves];

        return filterValidMoves(possibleMoves);
    },
};

export const ROOK = {
    dark: "\u265C",
    light: "\u2656",
    size: 1.2,
    getMoves: (row, col) => {
        const possibleMoves = [];

        for (let i = 0; i < 8; i++) {
            if (i !== col) possibleMoves.push({ row, col: i });
        }

        for (let i = 0; i < 8; i++) {
            if (i !== row) possibleMoves.push({ row: i, col });
        }

        return filterValidMoves(possibleMoves);
    },
};

export const BISHOP = {
    dark: "\u265D",
    light: "\u2657",
    size: 1.4,
    getMoves: (row, col) => {
        const possibleMoves = [];

        for (let i = 1; i < 8; i++) {
            if (row + i < 8 && col + i < 8)
                possibleMoves.push({ row: row + i, col: col + i });
            if (row - i >= 0 && col - i >= 0)
                possibleMoves.push({ row: row - i, col: col - i });
            if (row + i < 8 && col - i >= 0)
                possibleMoves.push({ row: row + i, col: col - i });
            if (row - i >= 0 && col + i < 8)
                possibleMoves.push({ row: row - i, col: col + i });
        }

        return filterValidMoves(possibleMoves);
    },
};

export const KNIGHT = {
    dark: "\u265E",
    light: "\u2658",
    size: 1.5,
    getMoves: (row, col) => {
        const possibleMoves = [
            { row: row + 2, col: col + 1 },
            { row: row + 2, col: col - 1 },
            { row: row - 2, col: col + 1 },
            { row: row - 2, col: col - 1 },
            { row: row + 1, col: col + 2 },
            { row: row + 1, col: col - 2 },
            { row: row - 1, col: col + 2 },
            { row: row - 1, col: col - 2 },
        ];

        return filterValidMoves(possibleMoves);
    },
};

export const PAWN = {
    dark: "\u265F",
    light: "\u2659",
    size: 1,
    getMoves: (row, col, isDark) => {
        const direction = isDark ? 1 : -1;
        const possibleMoves = [
            { row: row - direction, col, isAttackMove: false },
            { row: row + direction, col, isAttackMove: false },
            {
                row: row + direction,
                col: col + 1,
                isAttackMove: true,
            },
            {
                row: row + direction,
                col: col - 1,
                isAttackMove: true,
            },
        ];

        return filterValidMoves(possibleMoves);
    },
};

export const BACK_LANE = [
    ROOK,
    KNIGHT,
    BISHOP,
    KING,
    QUEEN,
    BISHOP,
    KNIGHT,
    ROOK,
];
