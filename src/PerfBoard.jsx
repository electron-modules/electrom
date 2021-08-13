import React, { useState, useEffect } from 'react';
import { Timer, FPSBoard, MemoryStats } from 'monitor.js';

const BOARD_WIDTH = 120;
const BOARD_HEIGHT = 48;
const TEXT_COLOR = 'rgb(0, 255, 0)';
const BORDER_COLOR = 'rgb(17, 51, 17)';

const PerfBoard = () => {
  const [container, setContainer] = useState(null);
  useEffect(() => {
    if (!container) return;
    const fpsBoard = new FPSBoard({
      container,
      alpha: 1,
      width: BOARD_WIDTH,
      textColor: TEXT_COLOR,
      boardColor: BORDER_COLOR,
      containerStyles: {
        position: 'absolute',
        left: 0,
        top: 0,
      },
    });

    const memoryStats = new MemoryStats({
      containerWidth: BOARD_WIDTH,
    });

    memoryStats.domElement.style.position = 'absolute';
    memoryStats.domElement.style.left = '0px';
    memoryStats.domElement.style.top = `${BOARD_HEIGHT + 2}px`;

    container.appendChild(memoryStats.domElement);

    const timer = new Timer();
    timer.update(() => {
      fpsBoard.tick();
      memoryStats.update();
    });

    timer.start();
  }, [
    container,
  ]);

  return (
    <div
      ref={setContainer}
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    />
  );
};

export default PerfBoard;
