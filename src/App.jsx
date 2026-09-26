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
import { classifyMove } from './engine/chessAI';
import { workerEngine } from './engine/workerEngine';
import { externalEngine } from './engine/externalEngine';
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
  const [boardTheme, setBoardTheme] = useState('emerald');
  const [pieceStyle, setPieceStyle] = useState('neo');
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [autoQueen, setAutoQueen] = useState(false);

  // Sound Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);

  // Neural & Engine Overlays (Disabled by default during player matches)
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showThreats, setShowThreats] = useState(false);
  const [showEngineArrow, setShowEngineArrow] = useState(false);
  const [isContinuousEval, setIsContinuousEval] = useState(true);
  const evalDebounceRef = useRef(null);

  // C++ Engine Backend State
  const [isCppConnected, setIsCppConnected] = useState(false);
  const [engineAnalysis, setEngineAnalysis] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const isThinkingRef = useRef(false); // Ref to avoid stale closure in async AI turn
  const [activePersona, setActivePersona] = useState(AI_PERSONAS[2]); // Tal default
  const [externalEngineUrl, setExternalEngineUrl] = useState('http://localhost:8080');

  // Play vs AI Match State (Defaults to active unlimited game)
  const [playerColor, setPlayerColor] = useState('w');
  const [timeControl, setTimeControl] = useState({ id: 'unlimited', label: 'Unlimited (Casual)', initial: null, inc: 0 });
  const [whiteTime, setWhiteTime] = useState(null);
  const [blackTime, setBlackTime] = useState(null);
  const [isGameActive, setIsGameActive] = useState(true);

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

  // C++ Backend Health Monitoring
  useEffect(() => {
    externalEngine.setUrl(externalEngineUrl);
    const unsubscribe = externalEngine.subscribe((connected) => {
      setIsCppConnected(connected);
    });
    // externalEngine schedules its own checks with exponential backoff internally
    return () => {
      unsubscribe();
    };
  }, [externalEngineUrl]);

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

  // Run engine analysis via Web Worker — ZERO main-thread blocking
  const runEvaluation = useCallback(
    (depth = 3) => {
      if (!isContinuousEval) return;
      // Debounce: cancel the previous evaluation timer
      if (evalDebounceRef.current) clearTimeout(evalDebounceRef.current);
      evalDebounceRef.current = setTimeout(async () => {
        try {
          const curFen = chess.fen();
          // Try C++ Backend first (fastest — native binary)
          if (externalEngine.isConnected) {
            const cppResult = await externalEngine.queryEvaluation(curFen, depth);
            if (cppResult) {
              setEngineAnalysis(cppResult);
              return;
            }
          }
          // JS Web Worker fallback — runs on separate OS thread
          const result = await workerEngine.search(curFen, depth, activePersona, 3);
          if (result) setEngineAnalysis(result);
        } catch (err) {
          console.error('Analysis error:', err);
        }
      }, 80); // 80ms debounce — skips rapid moves, lets board settle
    },
    [chess, isContinuousEval, activePersona]
  );

  useEffect(() => {
    runEvaluation(Math.min(activePersona?.depth || 3, 3));
  }, [fen, runEvaluation, activePersona]);

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

  // Keep a ref to chess.turn() so the timer interval never needs to re-subscribe
  const chessTurnRef = useRef(chess.turn());
  useEffect(() => {
    chessTurnRef.current = chess.turn();
  }, [fen]);

  // Play Mode Timers Loop — uses ref for turn; no chess.turn() in deps (avoids rapid re-subscribes)
  useEffect(() => {
    if (!isGameActive || timeControl.initial === null) return;

    const timer = setInterval(() => {
      if (chessTurnRef.current === 'w') {
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
  }, [isGameActive, timeControl, handleGameOver]);

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

  // Dispatch a chess move — board repaints immediately; static eval is fast (~0.1ms, no search)
  const makeMove = useCallback(
    (moveObj) => {
      try {
        const isWhiteTurn = chess.turn() === 'w';

        // evaluateBoard is a fast O(32) PST scan — safe to run synchronously (<1ms)
        const prevEval = evaluateBoard(chess);

        const isEngineBest =
          engineAnalysis?.bestMove &&
          engineAnalysis.bestMove.from === moveObj.from &&
          engineAnalysis.bestMove.to === moveObj.to;

        const moveResult = chess.move(moveObj);
        if (!moveResult) return false;

        // Update chess turn ref immediately
        chessTurnRef.current = chess.turn();

        // Sound triggers — synchronous, fast
        if (chess.inCheck()) {
          soundManager.playCheck();
        } else if (moveResult.captured) {
          soundManager.playCapture();
        } else if (moveResult.san.includes('O-O')) {
          soundManager.playCastle();
        } else {
          soundManager.playMove();
        }

        // Fast static eval of new position + classify quality
        const currEval = evaluateBoard(chess);
        const classification = classifyMove(prevEval, currEval, isWhiteTurn, isEngineBest);

        // Build move record with real eval data for Game Review
        const moveRecord = {
          ...moveResult,
          evalBefore: prevEval,
          evalAfter: currEval,
          classification
        };

        setHistory((prev) => {
          const newHistory = [...prev, moveRecord];
          setCurrentMoveIndex(newHistory.length - 1);
          return newHistory;
        });
        setLastMove({ from: moveResult.from, to: moveResult.to });
        setFen(chess.fen());

        if (activeMode === 'play') {
          setIsGameActive(true);
          setShowEngineArrow(false);
        }

        // Increment time if time control has increment
        if (isGameActive && timeControl.inc > 0) {
          if (isWhiteTurn) setWhiteTime((t) => (t ? t + timeControl.inc : t));
          else setBlackTime((t) => (t ? t + timeControl.inc : t));
        }

        // Defer game-over check until after the board has painted
        setTimeout(() => {
          checkGameTermination();
        }, 0);

        return moveResult;
      } catch (err) {
        console.error('Invalid move attempt:', err);
        return false;
      }
    },
    [chess, engineAnalysis, isGameActive, activeMode, timeControl, checkGameTermination]
  );

  // Play vs AI Engine Turn Trigger
  useEffect(() => {
    if (activeMode !== 'play' || !isGameActive) return;
    if (chess.isGameOver()) return;

    const currentTurn = chess.turn();
    const isAITurn = currentTurn !== playerColor;

    if (isAITurn && !isThinkingRef.current) {
      isThinkingRef.current = true;
      setIsThinking(true);
      // Minimum delay so "AI Thinking" badge renders before search begins
      const delay = isCppConnected ? 250 : 300;

      const timer = setTimeout(async () => {
        try {
          let aiMove = null;
          const currentFen = chess.fen();

          // 1) Try C++ binary backend (fastest — runs as native subprocess)
          if (externalEngine.isConnected) {
            const cppRes = await externalEngine.queryEvaluation(currentFen, activePersona.depth || 4);
            if (cppRes?.bestMove) {
              aiMove = { from: cppRes.bestMove.from, to: cppRes.bestMove.to };
            }
          }

          // 2) JS Web Worker fallback — runs on a separate thread, never blocks UI
          if (!aiMove) {
            const depth = Math.min(activePersona?.depth || 3, 3);
            const result = await workerEngine.search(currentFen, depth, activePersona, 4);
            if (result?.bestMove) {
              aiMove = result.bestMove;
            }
          }

          if (aiMove) {
            makeMove(aiMove);
          }
        } catch (err) {
          console.error('AI move error:', err);
        } finally {
          isThinkingRef.current = false;
          setIsThinking(false);
        }
      }, delay);

      return () => {
        clearTimeout(timer);
        isThinkingRef.current = false;
        setIsThinking(false);
      };
    }
  }, [fen, activeMode, isGameActive, playerColor, activePersona, chess, isCppConnected, makeMove]);

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
      let move = null;
      if (externalEngine.isConnected) {
        const cppRes = await externalEngine.queryEvaluation(chess.fen(), currentPersona.depth || 4);
        if (cppRes?.bestMove) {
          move = { from: cppRes.bestMove.from, to: cppRes.bestMove.to };
        }
      }
      if (!move) {
        move = await getAIMove(chess, currentPersona);
      }

      if (move) {
        makeMove(move);
      } else {
        setIsSimulationRunning(false);
      }
    }, simSpeedMs);

    return () => clearTimeout(timer);
  }, [fen, activeMode, isSimulationRunning, simSpeedMs, whitePersona, blackPersona, chess, makeMove]);

  // Start / Restart Match vs AI
  const handleStartPlayGame = useCallback(
    (chosenColor = playerColor, chosenPersona = activePersona) => {
      chess.reset();
      setFen(chess.fen());
      setHistory([]);
      setCurrentMoveIndex(-1);
      setLastMove(null);
      setWhiteTime(timeControl.initial);
      setBlackTime(timeControl.initial);
      setIsGameActive(true);
      setIsThinking(false);
      setOrientation(chosenColor === 'w' ? 'white' : 'black');
      soundManager.playMove();
    },
    [chess, playerColor, activePersona, timeControl]
  );

  // Switch Player Color (e.g. switch to Black and let AI open as White)
  const handleSetPlayerColor = (color) => {
    setPlayerColor(color);
    setOrientation(color === 'w' ? 'white' : 'black');
    handleStartPlayGame(color);
  };

  // Select AI Persona
  const handleSelectPersona = (persona) => {
    setActivePersona(persona);
  };

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

  // Whether user can interact with the board
  const isBoardInteractive =
    activeMode !== 'review' &&
    !isSimulationRunning &&
    !(activeMode === 'play' && (isThinking || chess.turn() !== playerColor));

  return (
    <div className="app-layout">
      {/* Global Navigation Header with live C++ Engine connection indicator */}
      <Header
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCppConnected={isCppConnected}
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
                  ? (activeMode === 'play' ? `${activePersona?.name} (AI)` : 'Black Engine')
                  : 'You (White)'}
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
              fen={fen}
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
              isInteractive={isBoardInteractive}
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
                  ? (activeMode === 'play' ? 'You (White)' : 'White Player')
                  : `${activePersona?.name} (AI)`}
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
              onStartGame={() => handleStartPlayGame(playerColor, activePersona)}
              onTakeback={() => {
                chess.undo();
                chess.undo(); // Undo both player and AI move
                setFen(chess.fen());
                setHistory(chess.history({ verbose: true }));
                setCurrentMoveIndex(chess.history().length - 1);
              }}
              onResign={() => handleGameOver(playerColor === 'w' ? '0-1' : '1-0', 'Resignation')}
              onOfferDraw={() => {
                const evalCp = evaluateBoard(chess);
                if (Math.abs(evalCp) <= 120) {
                  handleGameOver('1/2-1/2', 'Draw Agreed');
                } else {
                  alert(`${activePersona?.name} declined the draw and wants to play on!`);
                }
              }}
              onGetHint={() => setShowEngineArrow(true)}
              onSelectPersona={handleSelectPersona}
              activePersona={activePersona}
              playerColor={playerColor}
              onSetPlayerColor={handleSetPlayerColor}
              timeControl={timeControl}
              onSetTimeControl={setTimeControl}
              whiteTime={whiteTime}
              blackTime={blackTime}
              isGameActive={isGameActive}
              isThinking={isThinking}
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
              onAnalyzeDeep={async () => {
                setShowEngineArrow(true);
                await runEvaluation(5);
              }}
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
            activeMode={activeMode}
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
        onRematch={() => handleStartPlayGame(playerColor, activePersona)}
        onOpenReview={() => {
          setGameOverModal({ isOpen: false, result: '*', reason: '' });
          setActiveMode('review');
        }}
      />
    </div>
  );
}
