/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { CSSProperties, ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';

import { ActionButton, Flex, Heading, Text, View } from '@adobe/react-spectrum';

import { Chart } from '../Chart';
import { Axis, Bar, Legend } from '../components';
import useChartProps from '../hooks/useChartProps';
import { bindWithProps } from '../test-utils';

export default {
  title: 'RSC/Games/Tic-Tac-Toe',
  component: Chart,
};

// ─── Game constants ──────────────────────────────────────────────────────────

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

type Cell = 'X' | 'O' | null;

// ─── Game helpers ─────────────────────────────────────────────────────────────

function checkWinner(board: Cell[]): Cell {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isBoardFull(board: Cell[]): boolean {
  return board.every((cell) => cell !== null);
}

/**
 * Picks the computer's next move.
 * Strategy (in priority order):
 *  1. Win immediately if possible.
 *  2. Block the player from winning on the next move.
 *  3. Take the center.
 *  4. Take a corner.
 *  5. Take any remaining empty cell.
 */
function getComputerMove(board: Cell[]): number {
  const emptyIndices = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);

  for (const [a, b, c] of WINNING_LINES) {
    const line = [board[a], board[b], board[c]];
    const indices = [a, b, c];
    const oCount = line.filter((x) => x === 'O').length;
    const nullIdx = indices.find((i) => board[i] === null);
    if (oCount === 2 && nullIdx !== undefined) return nullIdx;
  }

  for (const [a, b, c] of WINNING_LINES) {
    const line = [board[a], board[b], board[c]];
    const indices = [a, b, c];
    const xCount = line.filter((x) => x === 'X').length;
    const nullIdx = indices.find((i) => board[i] === null);
    if (xCount === 2 && nullIdx !== undefined) return nullIdx;
  }

  if (board[4] === null) return 4;

  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const boardCellStyle = (cell: Cell, clickable: boolean): CSSProperties => ({
  width: 80,
  height: 80,
  fontSize: 36,
  fontWeight: 700,
  lineHeight: '80px',
  textAlign: 'center',
  cursor: clickable ? 'pointer' : 'default',
  background: 'var(--spectrum-global-color-gray-50, #fff)',
  border: '2px solid var(--spectrum-global-color-gray-400, #999)',
  borderRadius: 6,
  color: cell === 'X' ? 'var(--spectrum-global-color-blue-700, #0070f3)' : 'var(--spectrum-global-color-red-700, #e53e3e)',
  transition: 'background 0.1s',
  userSelect: 'none',
});

// ─── Main story component ─────────────────────────────────────────────────────

interface GameScore {
  wins: number;
  losses: number;
  draws: number;
}

const TicTacToeStory: StoryFn = (): ReactElement => {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Your turn — you are X');
  const [score, setScore] = useState<GameScore>({ wins: 0, losses: 0, draws: 0 });

  const chartData = [
    { outcome: 'Wins', count: score.wins, series: 'Wins' },
    { outcome: 'Losses', count: score.losses, series: 'Losses' },
    { outcome: 'Draws', count: score.draws, series: 'Draws' },
  ];

  const totalGames = score.wins + score.losses + score.draws;
  const chartProps = useChartProps({ data: chartData, width: 380, height: 260 });

  function handleCellClick(idx: number) {
    if (board[idx] !== null || !isPlayerTurn || gameOver) return;

    const next = [...board] as Cell[];
    next[idx] = 'X';

    const winner = checkWinner(next);
    if (winner) {
      setBoard(next);
      setGameOver(true);
      setStatusMessage('You win! Play again to continue.');
      setScore((s) => ({ ...s, wins: s.wins + 1 }));
      return;
    }
    if (isBoardFull(next)) {
      setBoard(next);
      setGameOver(true);
      setStatusMessage("It's a draw! Play again to continue.");
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      return;
    }

    setIsPlayerTurn(false);
    setStatusMessage("Computer is thinking…");

    // Slight delay so the player sees their move before the computer responds.
    setTimeout(() => {
      const computerIdx = getComputerMove(next);
      next[computerIdx] = 'O';

      const computerWinner = checkWinner(next);
      if (computerWinner) {
        setBoard([...next]);
        setGameOver(true);
        setStatusMessage('Computer wins! Play again to continue.');
        setScore((s) => ({ ...s, losses: s.losses + 1 }));
      } else if (isBoardFull(next)) {
        setBoard([...next]);
        setGameOver(true);
        setStatusMessage("It's a draw! Play again to continue.");
        setScore((s) => ({ ...s, draws: s.draws + 1 }));
      } else {
        setBoard([...next]);
        setIsPlayerTurn(true);
        setStatusMessage('Your turn — you are X');
      }
    }, 300);
  }

  function resetGame() {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setStatusMessage('Your turn — you are X');
  }

  return (
    <Flex direction="row" gap="size-600" alignItems="start" wrap>
      {/* ── Board ── */}
      <View>
        <Heading level={2} marginBottom="size-100">
          Tic-Tac-Toe
        </Heading>
        <Text>{statusMessage}</Text>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 80px)',
            gap: 6,
            margin: '16px 0',
          }}
        >
          {board.map((cell, idx) => (
            <div
              key={idx}
              role="button"
              aria-label={cell ? `Cell ${idx + 1}: ${cell}` : `Cell ${idx + 1}: empty`}
              tabIndex={cell === null && isPlayerTurn && !gameOver ? 0 : -1}
              style={boardCellStyle(cell, cell === null && isPlayerTurn && !gameOver)}
              onClick={() => handleCellClick(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCellClick(idx);
              }}
            >
              {cell}
            </div>
          ))}
        </div>

        <ActionButton onPress={resetGame}>{gameOver ? 'Play Again' : 'Reset Game'}</ActionButton>
      </View>

      {/* ── Score chart ── */}
      <View>
        <Heading level={3} marginBottom="size-50">
          Game Results
        </Heading>
        <Text>{totalGames === 0 ? 'No games played yet' : `Total games: ${totalGames}`}</Text>

        <View marginTop="size-200">
          <Chart {...chartProps}>
            <Axis position="bottom" baseline title="Outcome" />
            <Axis position="left" grid title="Games" />
            <Bar dimension="outcome" metric="count" color="series" />
            <Legend />
          </Chart>
        </View>
      </View>
    </Flex>
  );
};

const TicTacToe = bindWithProps(TicTacToeStory);
TicTacToe.args = {};

export { TicTacToe };
