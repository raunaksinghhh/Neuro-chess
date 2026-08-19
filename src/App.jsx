import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Header } from './components/Header/Header';
import { Chessboard } from './components/Chessboard/Chessboard';
import { EvalBar } from './components/Evaluation/EvalBar';
import { MoveList } from './components/MoveHistory/MoveList';
import { EnginePanel } from './components/EnginePanel/EnginePanel';
import { GameReview } from './components/GameReview/GameReview';
import { PlayMode } from './components/Modes/PlayMode';
import { EngineVsEngineMode } from './components/Modes/EngineVsEngineMode';
import { AnalysisMode } from './components/Modes/AnalysisMode';
import { PuzzleMode } from './components/Modes/PuzzleMode';
import { SettingsModal } from './components/Modals/SettingsModal';
import { FENModal } from './components/Modals/FENModal';
import { GameOverModal } from './components/Modals/GameOverModal';

import { soundManager } from './utils/sound';
import { detectOpening, exportPGN } from './utils/pgnParser';
import { calculateNeuralHeatmap, evaluateBoard } from './engine/neuralEval';
import { getEngineAnalysis, getAIMove, classifyMove } from './engine/chessAI';
import { AI_PERSONAS, getPersonaByElo } from './engine/personas';
import { CHESS_PUZZLES } from './engine/puzzles';

import './App.css';

export default function App() {
  // Master Chess Game instance
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [history, setHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [lastMove, setLastMove] = useState(null);

  // Active Mode: 'play' | 'analysis' | 'engine_vs_engine' | 'puzzles' | 'review'
  const [activeMode, setActiveMode] = useState('play');

  // Board View Preferences
  const [orientation, setOrientation] = useState('white');
  const [boardTheme, setBoardTheme] = useState('cyber');
  const [pieceStyle, setPieceStyle] = useState('neo');
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [autoQueen, setAutoQueen] = useState(false);

  // Sound Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);

  // Neural & Engine Overlays
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showThreats, setShowThreats] = useState(false);
  const [showEngineArrow, setShowEngineArrow] = useState(true);
  const [isContinuousEval, setIsContinuousEval] = useState(true);

  // Engine Telemetry State
  const [engineAnalysis, setEngineAnalysis] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [activePersona, setActivePersona] = useState(AI_PERSONAS[2]); // Tal default
  const [externalEngineUrl, setExternalEngineUrl] = useState('');

  // Play vs AI Match State
  const [playerColor, setPlayerColor] = useState('w');
  const [timeControl, setTimeControl] = useState({ id: '10m', label: '10m Rapid', initial: 600, inc: 0 });
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [isGameActive, setIsGameActive] = useState(false);

  // Engine vs Engine Match State
  const [whitePersona, setWhitePersona] = useState(AI_PERSONAS[2]); // Tal
  const [blackPersona, setBlackPersona] = useState(AI_PERSONAS[3]); // Magnus
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simSpeedMs, setSimSpeedMs] = useState(800);

  // Puzzle State
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzleRating, setPuzzleRating] = useState(1500);
  const [puzzleStreak, setPuzzleStreak] = useState(0);
  const [puzzleStep, setPuzzleStep] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState('playing'); // 'playing' | 'solved' | 'failed'
  const [hintVisible, setHintVisible] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFENModalOpen, setIsFENModalOpen] = useState(false);
  const [gameOverModal, setGameOverModal] = useState({ isOpen: false, result: '*', reason: '' });

  // Update sound manager
  useEffect(() => {
    soundManager.enabled = soundEnabled;
    soundManager.volume = soundVolume;
  }, [soundEnabled, soundVolume]);

  // Compute opening book name
  const openingInfo = useMemo(() => {
    return detectOpening(history);
  }, [history]);

  // Compute neural heatmap data
  const heatmapData = useMemo(() => {
    if (!showHeatmap && !showThreats) return null;
    return calculateNeuralHeatmap(chess);
  }, [fen, showHeatmap, showThreats, chess]);

  // Threat arrows generated from neural calculations
  const threatArrows = useMemo(() => {
    if (!showThreats || !heatmapData?.attackedSquares) return [];
    // Convert attacked squares to arrows
    return heatmapData.attackedSquares.slice(0, 3).map((atk) => ({
      from: atk.square,
      to: atk.square
    }));
  }, [showThreats, heatmapData]);

  // Engine Best Move Arrow
  const engineArrow = useMemo(() => {
    if (!showEngineArrow || !engineAnalysis?.bestMove) return null;
    return {
      from: engineAnalysis.bestMove.from,
      to: engineAnalysis.bestMove.to
    };
  }, [showEngineArrow, engineAnalysis]);

  // Run engine analysis whenever position changes
  const runEvaluation = useCallback(
    async (depth = 3) => {
      if (!isContinuousEval) return;
      try {
        const analysis = await getEngineAnalysis(chess, depth, 3);
        setEngineAnalysis(analysis);
      } catch (err) {
        console.error('Analysis error:', err);
      }
    },
    [chess, isContinuousEval]
  );

  useEffect(() => {
    runEvaluation(activePersona?.depth || 3);
  }, [fen, runEvaluation, activePersona]);

  // Play Mode Timers Loop
  useEffect(() => {
    if (!isGameActive || timeControl.initial === null) return;

    const timer = setInterval(() => {
      if (chess.turn() === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleGameOver('0-1', 'White Flagged (Timeout)');
            return 0;
          }
          if (prev <= 10) soundManager.playTick();
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleGameOver('1-0', 'Black Flagged (Timeout)');
            return 0;
          }
          if (prev <= 10) soundManager.playTick();
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, chess.turn(), timeControl]);

  // Handle Game Over
  const handleGameOver = useCallback(
    (result, reason) => {
      setIsGameActive(false);
      setIsSimulationRunning(false);
      if (result === '1-0' || result === '0-1') {
        soundManager.playVictory();
      }
      setGameOverModal({ isOpen: true, result, reason });
    },
    []
  );

  // Check board state after every move
  const checkGameTermination = useCallback(() => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? '0-1' : '1-0';
      handleGameOver(winner, 'Checkmate');
      return true;
    }
    if (chess.isStalemate()) {
      handleGameOver('1/2-1/2', 'Stalemate');
      return true;
    }
    if (chess.isThreefoldRepetition()) {
      handleGameOver('1/2-1/2', 'Threefold Repetition');
      return true;
    }
    if (chess.isInsufficientMaterial()) {
      handleGameOver('1/2-1/2', 'Insufficient Material');
      return true;
    }
    if (chess.isDraw()) {
      handleGameOver('1/2-1/2', 'Draw (50-move rule)');
      return true;
    }
    return false;
  }, [chess, handleGameOver]);

  // Dispatch a chess move
  const makeMove = useCallback(
    (moveObj) => {
      try {
        const prevEval = evaluateBoard(chess);
        const isWhiteTurn = chess.turn() === 'w';

        // Check if move is engine best
        const isEngineBest =
          engineAnalysis?.bestMove &&
          engineAnalysis.bestMove.from === moveObj.from &&
          engineAnalysis.bestMove.to === moveObj.to;

        const moveResult = chess.move(moveObj);
        if (!moveResult) return false;

        const currEval = evaluateBoard(chess);
        const classification = classifyMove(prevEval, currEval, isWhiteTurn, isEngineBest);

        // Sound triggers
        if (chess.inCheck()) {
          soundManager.playCheck();
        } else if (moveResult.captured) {
          soundManager.playCapture();
        } else if (moveResult.san.includes('O-O')) {
          soundManager.playCastle();
        } else {
          soundManager.playMove();
        }

        const moveRecord = {
          ...moveResult,
          evalBefore: prevEval,
          evalAfter: currEval,
          classification
        };

        const newHistory = [...history, moveRecord];
        setHistory(newHistory);
        setCurrentMoveIndex(newHistory.length - 1);
        setLastMove({ from: moveResult.from, to: moveResult.to });
        setFen(chess.fen());

        // Increment time if time control has increment
        if (isGameActive && timeControl.inc > 0) {
          if (isWhiteTurn) setWhiteTime((t) => t + timeControl.inc);
          else setBlackTime((t) => t + timeControl.inc);
        }

        checkGameTermination();
        return moveResult;
      } catch (err) {
        console.error('Invalid move attempt:', err);
        return false;
      }
    },
    [chess, engineAnalysis, history, isGameActive, timeControl, checkGameTermination]
  );

  // Play vs AI Engine Turn Trigger
  useEffect(() => {
    if (activeMode !== 'play' || !isGameActive) return;
    if (chess.isGameOver()) return;

    const currentTurn = chess.turn();
    const isAITurn = currentTurn !== playerColor;

    if (isAITurn && !isThinking) {
      setIsThinking(true);
      const delay = Math.max(350, Math.random() * 600);

      const timer = setTimeout(async () => {
        const aiMove = await getAIMove(chess, activePersona);
        if (aiMove) {
          makeMove(aiMove);
        }
        setIsThinking(false);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [fen, activeMode, isGameActive, playerColor, isThinking, activePersona, chess, makeMove]);

  // Engine vs Engine Self-Play Loop
  useEffect(() => {
    if (activeMode !== 'engine_vs_engine' || !isSimulationRunning) return;
    if (chess.isGameOver()) {
      setIsSimulationRunning(false);
      return;
    }

    const currentTurn = chess.turn();
    const currentPersona = currentTurn === 'w' ? whitePersona : blackPersona;

    const timer = setTimeout(async () => {
      const move = await getAIMove(chess, currentPersona);
      if (move) {
        makeMove(move);
      } else {
        setIsSimulationRunning(false);
      }
    }, simSpeedMs);

    return () => clearTimeout(timer);
  }, [fen, activeMode, isSimulationRunning, simSpeedMs, whitePersona, blackPersona, chess, makeMove]);

  // Load a Puzzle
  const loadPuzzle = useCallback(
    (index) => {
      const puz = CHESS_PUZZLES[index % CHESS_PUZZLES.length];
      chess.load(puz.fen);
      setFen(chess.fen());
      setHistory([]);
      setCurrentMoveIndex(-1);
      setLastMove(null);
      setOrientation(puz.playerColor === 'w' ? 'white' : 'black');
      setPuzzleStep(0);
      setPuzzleStatus('playing');
      setHintVisible(false);
    },
    [chess]
  );

  // Switch Active Mode
  const handleSelectMode = (mode) => {
    setActiveMode(mode);
    setIsSimulationRunning(false);

    if (mode === 'puzzles') {
      loadPuzzle(puzzleIndex);
    } else if (mode === 'play') {
      setOrientation(playerColor === 'w' ? 'white' : 'black');
    }
  };

  // Puzzle Move Interceptor
  const handlePuzzleMove = (moveObj) => {
    const curPuzzle = CHESS_PUZZLES[puzzleIndex % CHESS_PUZZLES.length];
    const expectedMove = curPuzzle.moves[puzzleStep];

    const result = makeMove(moveObj);
    if (!result) return;

    if (result.san === expectedMove || `${result.from}${result.to}` === expectedMove) {
      const nextStep = puzzleStep + 1;

      if (nextStep >= curPuzzle.moves.length) {
        // Puzzle Completed!
        setPuzzleStatus('solved');
        setPuzzleRating((r) => r + 15);
        setPuzzleStreak((s) => s + 1);
        soundManager.playVictory();
      } else {
        // Auto-play opponent's response from puzzle solution
        setPuzzleStep(nextStep);
        setTimeout(() => {
          const opponentMoveSan = curPuzzle.moves[nextStep];
          makeMove(opponentMoveSan);
          setPuzzleStep(nextStep + 1);
        }, 400);
      }
    } else {
      // Wrong move
      setPuzzleStatus('failed');
      soundManager.playBlunder();
      setPuzzleStreak(0);
    }
  };

  // Move Navigation (MoveList click / arrow keys)
  const handleNavigateMove = (moveIdx) => {
    if (moveIdx === currentMoveIndex) return;

    // Reset board to initial or step to target move
    const tempChess = new Chess();
    if (activeMode === 'puzzles') {
      const puz = CHESS_PUZZLES[puzzleIndex % CHESS_PUZZLES.length];
      tempChess.load(puz.fen);
    }

    for (let i = 0; i <= moveIdx; i++) {
      tempChess.move(history[i]);
    }

    chess.load(tempChess.fen());
    setFen(chess.fen());
    setCurrentMoveIndex(moveIdx);
    if (moveIdx >= 0 && history[moveIdx]) {
      setLastMove({ from: history[moveIdx].from, to: history[moveIdx].to });
    } else {
      setLastMove(null);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNavigateMove(Math.max(-1, currentMoveIndex - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNavigateMove(Math.min(history.length - 1, currentMoveIndex + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNavigateMove(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNavigateMove(history.length - 1);
      } else if (e.key.toLowerCase() === 'f') {
        setOrientation((o) => (o === 'white' ? 'black' : 'white'));
      } else if (e.key.toLowerCase() === 'h') {
        setShowEngineArrow((a) => !a);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex, history]);

  // Start Play Match
  const handleStartPlayGame = () => {
    chess.reset();
    setFen(chess.fen());
    setHistory([]);
    setCurrentMoveIndex(-1);
    setLastMove(null);
    setWhiteTime(timeControl.initial);
    setBlackTime(timeControl.initial);
    setIsGameActive(true);
    setOrientation(playerColor === 'w' ? 'white' : 'black');
    soundManager.playMove();
  };

  // Reset / Clear board
  const handleResetBoard = () => {
    chess.reset();
    setFen(chess.fen());
    setHistory([]);
    setCurrentMoveIndex(-1);
    setLastMove(null);
    setIsGameActive(false);
    setIsSimulationRunning(false);
  };

  // FEN / PGN Loaders
  const handleLoadFEN = (fenStr) => {
    try {
      chess.load(fenStr);
      setFen(chess.fen());
      setHistory([]);
      setCurrentMoveIndex(-1);
      setLastMove(null);
      return true;
    } catch {
      return false;
    }
  };

  const handleLoadPGN = (pgnStr) => {
    try {
      chess.loadPgn(pgnStr);
      setFen(chess.fen());
      setHistory(chess.history({ verbose: true }));
      setCurrentMoveIndex(chess.history().length - 1);
      return true;
    } catch {
      return false;
    }
  };

  // Current evaluation score
  const evalScore = engineAnalysis?.score || 0;

  return (
    <div className="app-layout">
      {/* Global Navigation Header */}
      <Header
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="main-content">
        {/* Left Column: Chessboard & Eval Bar & Player Badges */}
        <div className="board-column">
          {/* Top Player Info Bar */}
          <div className="player-bar">
            <div className="player-info">
              <div className="player-avatar">
                {orientation === 'white' ? activePersona?.avatar : '👤'}
              </div>
              <div className="player-name">
                {orientation === 'white'
                  ? (activeMode === 'play' ? activePersona?.name : 'Black Engine')
                  : 'White Player'}
              </div>
            </div>
            <span className="badge badge-purple">
              {orientation === 'white' ? (activeMode === 'play' ? `Elo ${activePersona?.elo}` : '⚫ Black') : '⚪ White'}
            </span>
          </div>

          {/* Interactive Chessboard + Animated Eval Bar */}
          <div className="board-wrapper">
            <EvalBar score={evalScore} orientation={orientation} />

            <Chessboard
              chess={chess}
              onMove={activeMode === 'puzzles' ? handlePuzzleMove : makeMove}
              orientation={orientation}
              boardTheme={boardTheme}
              pieceStyle={pieceStyle}
              showCoordinates={showCoordinates}
              showHeatmap={showHeatmap}
              heatmapData={heatmapData}
              engineArrow={engineArrow}
              threatArrows={threatArrows}
              lastMove={lastMove}
              isInteractive={activeMode !== 'review' && !isSimulationRunning}
              autoQueen={autoQueen}
            />
          </div>

          {/* Bottom Player Info Bar */}
          <div className="player-bar">
            <div className="player-info">
              <div className="player-avatar">
                {orientation === 'white' ? '👤' : activePersona?.avatar}
              </div>
              <div className="player-name">
                {orientation === 'white'
                  ? (activeMode === 'play' ? 'You' : 'White Player')
                  : activePersona?.name}
              </div>
            </div>
            <span className="badge badge-cyan">
              {orientation === 'white' ? '⚪ White' : '⚫ Black'}
            </span>
          </div>
        </div>

        {/* Right Column: Mode Panel, Move History & Game Review */}
        <div className="sidebar-column">
          {/* Mode Switcher View */}
          {activeMode === 'play' && (
            <PlayMode
              gameState={{ turn: chess.turn() }}
              onStartGame={handleStartPlayGame}
              onTakeback={() => {
                chess.undo();
                chess.undo(); // Undo both player and AI move
                setFen(chess.fen());
                setHistory(chess.history({ verbose: true }));
                setCurrentMoveIndex(chess.history().length - 1);
              }}
              onResign={() => handleGameOver(playerColor === 'w' ? '0-1' : '1-0', 'Resignation')}
              onOfferDraw={() => handleGameOver('1/2-1/2', 'Draw Agreed')}
              onGetHint={() => setShowEngineArrow(true)}
              onSelectPersona={setActivePersona}
              activePersona={activePersona}
              playerColor={playerColor}
              onSetPlayerColor={setPlayerColor}
              timeControl={timeControl}
              onSetTimeControl={setTimeControl}
              whiteTime={whiteTime}
              blackTime={blackTime}
              isGameActive={isGameActive}
            />
          )}

          {activeMode === 'engine_vs_engine' && (
            <EngineVsEngineMode
              whitePersona={whitePersona}
              blackPersona={blackPersona}
              onSetWhitePersona={setWhitePersona}
              onSetBlackPersona={setBlackPersona}
              isRunning={isSimulationRunning}
              onToggleRunning={() => setIsSimulationRunning((r) => !r)}
              onReset={handleResetBoard}
              speedMs={simSpeedMs}
              onSetSpeedMs={setSimSpeedMs}
            />
          )}

          {activeMode === 'analysis' && (
            <AnalysisMode
              onResetBoard={handleResetBoard}
              onClearBoard={() => {
                chess.clear();
                setFen(chess.fen());
                setHistory([]);
              }}
              onOpenFENModal={() => setIsFENModalOpen(true)}
              isContinuousEval={isContinuousEval}
              onToggleContinuousEval={() => setIsContinuousEval((e) => !e)}
              onAnalyzeDeep={() => runEvaluation(5)}
            />
          )}

          {activeMode === 'puzzles' && (
            <PuzzleMode
              currentPuzzle={CHESS_PUZZLES[puzzleIndex % CHESS_PUZZLES.length]}
              puzzleRating={puzzleRating}
              streak={puzzleStreak}
              onNextPuzzle={() => {
                const nextIdx = puzzleIndex + 1;
                setPuzzleIndex(nextIdx);
                loadPuzzle(nextIdx);
              }}
              onRetryPuzzle={() => loadPuzzle(puzzleIndex)}
              onShowHint={() => setHintVisible(true)}
              hintVisible={hintVisible}
              puzzleStatus={puzzleStatus}
            />
          )}

          {activeMode === 'review' && (
            <GameReview
              history={history}
              onSelectMove={handleNavigateMove}
              currentMoveIndex={currentMoveIndex}
            />
          )}

          {/* Move History Table */}
          {activeMode !== 'review' && (
            <MoveList
              history={history}
              currentMoveIndex={currentMoveIndex}
              onNavigate={handleNavigateMove}
              onFlipBoard={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}
              onExportPGN={() => {
                const pgn = exportPGN(history, 'Player', activePersona?.name);
                navigator.clipboard.writeText(pgn);
                alert('PGN game notation copied to clipboard!');
              }}
              onCopyFEN={() => {
                navigator.clipboard.writeText(chess.fen());
                alert('Position FEN copied to clipboard!');
              }}
              openingInfo={openingInfo}
            />
          )}

          {/* Engine Search Telemetry Panel */}
          <EnginePanel
            engineAnalysis={engineAnalysis}
            activePersona={activePersona}
            isThinking={isThinking}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap((h) => !h)}
            showThreats={showThreats}
            onToggleThreats={() => setShowThreats((t) => !t)}
            showEngineArrow={showEngineArrow}
            onToggleEngineArrow={() => setShowEngineArrow((a) => !a)}
            onSelectCandidateMove={(m) => makeMove(m)}
          />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        boardTheme={boardTheme}
        onSetBoardTheme={setBoardTheme}
        pieceStyle={pieceStyle}
        onSetPieceStyle={setPieceStyle}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        soundVolume={soundVolume}
        onSetSoundVolume={setSoundVolume}
        showCoordinates={showCoordinates}
        onToggleCoordinates={() => setShowCoordinates((c) => !c)}
        autoQueen={autoQueen}
        onToggleAutoQueen={() => setAutoQueen((q) => !q)}
        externalEngineUrl={externalEngineUrl}
        onSetExternalEngineUrl={setExternalEngineUrl}
      />

      {/* FEN / PGN Modal */}
      <FENModal
        isOpen={isFENModalOpen}
        onClose={() => setIsFENModalOpen(false)}
        currentFEN={chess.fen()}
        currentPGN={exportPGN(history)}
        onLoadFEN={handleLoadFEN}
        onLoadPGN={handleLoadPGN}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameOverModal.isOpen}
        onClose={() => setGameOverModal({ isOpen: false, result: '*', reason: '' })}
        result={gameOverModal.result}
        reason={gameOverModal.reason}
        playerColor={playerColor}
        onRematch={handleStartPlayGame}
        onOpenReview={() => {
          setGameOverModal({ isOpen: false, result: '*', reason: '' });
          setActiveMode('review');
        }}
      />
    </div>
  );
}
