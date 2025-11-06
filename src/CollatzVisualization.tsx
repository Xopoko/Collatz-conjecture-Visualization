import React, { useState, useEffect, useRef } from 'react';

const CollatzVisualization = () => {
  const [n, setN] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const previousNRef = useRef(1);
  const previousZoomRef = useRef(1);
  const previousOffsetRef = useRef({ x: 0, y: 0 });

  const collatzSequence = (num) => {
    const sequence = [num];
    let iterations = 0;
    const maxIterations = 10000;
    
    while (num !== 1 && iterations < maxIterations) {
      num = num % 2 === 0 ? num / 2 : 3 * num + 1;
      sequence.push(num);
      iterations++;
    }
    return sequence;
  };

  // Обработка изменения размера окна
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Инициализация canvas
  useEffect(() => {
    if (dimensions.width > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      canvas.style.width = dimensions.width + 'px';
      canvas.style.height = dimensions.height + 'px';
      ctx.scale(dpr, dpr);
    }
  }, [dimensions]);

  const drawGrid = (ctx, width, height) => {
    const sampleSequences = [];
    for (let i = 1; i <= Math.min(9999, 100); i += Math.max(1, Math.floor(9999 / 100))) {
      sampleSequences.push(collatzSequence(i));
    }
    
    const maxLength = Math.max(...sampleSequences.map(s => s.length), 1);
    const maxVal = Math.max(...sampleSequences.flat(), 1);

    const leftMargin = 60;
    const rightMargin = 40;
    const topMargin = 40;
    const bottomMargin = 60;
    
    const drawWidth = width - leftMargin - rightMargin;
    const drawHeight = height - topMargin - bottomMargin;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= 5; i++) {
      const y = topMargin + (drawHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(width - rightMargin, y);
      ctx.stroke();
      
      const value = Math.round(maxVal * (1 - i / 5));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, leftMargin - 10, y);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = leftMargin + (drawWidth / 5) * i;
      const iteration = Math.round((maxLength / 5) * i);
      ctx.fillText(iteration, x, height - bottomMargin + 20);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Iterations', width / 2, height - 15);
  };

  const drawSequence = (ctx, i, width, height, maxLength, maxVal, isHighlighted = false) => {
    const sequence = collatzSequence(i);
    if (sequence.length < 2) return;

    const leftMargin = 60;
    const topMargin = 40;
    const bottomMargin = 60;
    const drawWidth = width - leftMargin - 40;
    const drawHeight = height - topMargin - bottomMargin;
    const xStep = drawWidth / Math.max(maxLength, 1);

    const hue = (i * 15) % 60 + 200;
    const opacity = isHighlighted ? 0.6 : 0.2;
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
    ctx.lineWidth = isHighlighted ? 2 : 0.8;
    
    if (isHighlighted) {
      ctx.shadowBlur = 6;
      ctx.shadowColor = `hsla(${hue}, 80%, 65%, 0.5)`;
    }
    
    ctx.beginPath();
    
    for (let j = 0; j < sequence.length; j++) {
      const val = sequence[j];
      const x = leftMargin + j * xStep;
      const y = topMargin + drawHeight - (val / maxVal) * drawHeight;
      
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Рисуем узлы и числа для ВСЕХ последовательностей
    // Определяем частоту отображения чисел в зависимости от количества узлов
    const showEvery = isHighlighted ? 
      (sequence.length > 50 ? Math.ceil(sequence.length / 30) : 1) :
      (sequence.length > 30 ? Math.ceil(sequence.length / 10) : Math.max(2, Math.ceil(sequence.length / 5)));
    
    for (let j = 0; j < sequence.length; j++) {
      const val = sequence[j];
      const x = leftMargin + j * xStep;
      const y = topMargin + drawHeight - (val / maxVal) * drawHeight;
      
      const isStart = j === 0;
      const isEnd = j === sequence.length - 1;
      const isPeak = j > 0 && j < sequence.length - 1 && 
                     sequence[j] > sequence[j-1] && sequence[j] > sequence[j+1];
      
      // Цвет и размер узла
      let nodeColor = `hsla(${hue}, 80%, 60%, ${isHighlighted ? 0.8 : 0.4})`;
      let nodeSize = isHighlighted ? 3 : 2;
      let showNumber = false;
      
      if (isStart) {
        nodeColor = isHighlighted ? '#FFD700' : `hsla(45, 100%, 50%, ${0.5})`;
        nodeSize = isHighlighted ? 5 : 3;
        showNumber = true;
      } else if (isEnd) {
        nodeColor = isHighlighted ? '#FF6B6B' : `hsla(0, 80%, 65%, ${0.5})`;
        nodeSize = isHighlighted ? 3.5 : 2.5;
        showNumber = isHighlighted;
      } else if (isPeak) {
        nodeColor = isHighlighted ? '#5FD35F' : `hsla(120, 60%, 60%, ${0.5})`;
        nodeSize = isHighlighted ? 4 : 2.5;
        showNumber = isHighlighted || (j % (showEvery * 2) === 0);
      } else if (j % showEvery === 0) {
        showNumber = true;
      }
      
      // Рисуем узел
      ctx.shadowBlur = isHighlighted ? (isStart ? 12 : (isPeak ? 10 : 6)) : 3;
      ctx.shadowColor = nodeColor;
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Рисуем число
      if (showNumber) {
        const fontSize = isHighlighted ? (isStart ? 11 : 10) : 8;
        ctx.font = (isHighlighted && isStart) ? `bold ${fontSize}px monospace` : `${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Фон для лучшей читаемости
        const text = val.toString();
        const metrics = ctx.measureText(text);
        const padding = 2;
        
        ctx.fillStyle = `rgba(3, 11, 46, ${isHighlighted ? 0.8 : 0.6})`;
        ctx.fillRect(
          x - metrics.width / 2 - padding, 
          y - (isHighlighted ? 18 : 14), 
          metrics.width + padding * 2, 
          fontSize + 2
        );
        
        ctx.fillStyle = isHighlighted ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(text, x, y - (isHighlighted ? 8 : 6));
      }
    }
  };

  // Основная логика рисования
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    const width = dimensions.width;
    const height = dimensions.height;

    // Сохраняем состояние и применяем трансформации
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Очистка всего canvas
    ctx.fillStyle = '#030B2E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Применяем масштаб и смещение
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    const sampleSequences = [];
    for (let i = 1; i <= Math.min(9999, 100); i += Math.max(1, Math.floor(9999 / 100))) {
      sampleSequences.push(collatzSequence(i));
    }
    const maxLength = Math.max(...sampleSequences.map(s => s.length), 1);
    const maxVal = Math.max(...sampleSequences.flat(), 1);

    drawGrid(ctx, width, height);

    // После очистки canvas нужно рисовать ВСЕ кривые от 1 до N
    for (let i = 1; i <= n; i++) {
      drawSequence(ctx, i, width, height, maxLength, maxVal, i === n);
    }

    previousNRef.current = n;
    previousZoomRef.current = zoom;
    previousOffsetRef.current = { x: offset.x, y: offset.y };
    ctx.restore();

  }, [n, dimensions, zoom, offset]);

  // Обработчик колесика мыши для зума
  const handleWheel = (e) => {
    e.preventDefault();
    
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.1, zoom + delta), 10);
    
    // Зум к позиции курсора
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomPointX = (mouseX - offset.x) / zoom;
    const zoomPointY = (mouseY - offset.y) / zoom;
    
    const newOffsetX = mouseX - zoomPointX * newZoom;
    const newOffsetY = mouseY - zoomPointY * newZoom;
    
    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Обработчики для перетаскивания
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#030B2E';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    setN(1);
    previousNRef.current = 1;
  };

  const handleResetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const sequence = collatzSequence(n);
  const iterations = sequence.length - 1;
  const maxValue = Math.max(...sequence);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100vw', 
        height: '100vh', 
        background: 'linear-gradient(to bottom, #030B2E 0%, #05102E 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'monospace'
      }}
    >
      {/* Верхняя панель информации */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '30px',
        color: 'white',
        fontSize: 'clamp(14px, 2vw, 18px)',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '15px 20px',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(74, 158, 255, 0.3)'
      }}>
        <div style={{ marginBottom: '8px', fontSize: 'clamp(18px, 3vw, 24px)', color: '#FFD700' }}>
          N: {n.toLocaleString()}
        </div>
        <div style={{ marginBottom: '4px', color: 'rgba(255, 255, 255, 0.8)' }}>
          Iterations: {iterations}
        </div>
        <div style={{ marginBottom: '4px', color: 'rgba(255, 255, 255, 0.8)' }}>
          Max: {maxValue.toLocaleString()}
        </div>
        <div style={{ marginBottom: '4px', color: 'rgba(95, 211, 95, 0.9)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
          Curves: {n}
        </div>
        <div style={{ color: 'rgba(138, 180, 248, 0.9)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
          Zoom: {zoom.toFixed(2)}x
        </div>
      </div>

      {/* Контроль */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        width: '90%',
        maxWidth: '700px'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '15px',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '20px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(74, 158, 255, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <input
              type="range"
              min="1"
              max="9999"
              value={n}
              onChange={(e) => setN(parseInt(e.target.value))}
              style={{
                flex: 1,
                minWidth: '200px',
                height: '6px',
                background: 'linear-gradient(to right, rgba(74, 158, 255, 0.3), rgba(74, 158, 255, 0.6))',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />
            <input
              type="number"
              min="1"
              max="9999"
              value={n}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val > 0 && val <= 9999) setN(val);
              }}
              style={{
                width: '100px',
                padding: '8px 12px',
                background: 'rgba(74, 158, 255, 0.2)',
                border: '1px solid rgba(74, 158, 255, 0.5)',
                borderRadius: '5px',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: 'clamp(14px, 2vw, 16px)'
              }}
            />
          </div>
          
          {/* Быстрые кнопки */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[27, 97, 127, 871, 6171, 9999].map(num => (
              <button
                key={num}
                onClick={() => setN(num)}
                style={{
                  padding: '6px 12px',
                  background: n === num ? 'rgba(74, 158, 255, 0.5)' : 'rgba(74, 158, 255, 0.2)',
                  border: '1px solid rgba(74, 158, 255, 0.5)',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 'clamp(11px, 1.5vw, 13px)',
                  fontFamily: 'monospace',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(74, 158, 255, 0.4)'}
                onMouseLeave={(e) => e.target.style.background = n === num ? 'rgba(74, 158, 255, 0.5)' : 'rgba(74, 158, 255, 0.2)'}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleResetZoom}
              style={{
                padding: '6px 16px',
                background: 'rgba(138, 180, 248, 0.3)',
                border: '1px solid rgba(138, 180, 248, 0.5)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: 'clamp(11px, 1.5vw, 13px)',
                fontFamily: 'monospace',
                transition: 'all 0.2s',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(138, 180, 248, 0.5)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(138, 180, 248, 0.3)'}
            >
              Reset
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '6px 16px',
                background: 'rgba(255, 107, 107, 0.3)',
                border: '1px solid rgba(255, 107, 107, 0.5)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: 'clamp(11px, 1.5vw, 13px)',
                fontFamily: 'monospace',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 107, 107, 0.5)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 107, 107, 0.3)'}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />

      {/* Легенда */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '30px',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 'clamp(10px, 1.5vw, 12px)',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '12px 15px',
        borderRadius: '6px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(74, 158, 255, 0.2)'
      }}>
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '12px', 
            height: '12px', 
            background: '#FFD700',
            borderRadius: '50%',
            boxShadow: '0 0 10px #FFD700',
            display: 'inline-block'
          }}></span>
          Start
        </div>
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '12px', 
            height: '12px', 
            background: '#5FD35F',
            borderRadius: '50%',
            boxShadow: '0 0 10px #5FD35F',
            display: 'inline-block'
          }}></span>
          Peaks
        </div>
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '12px', 
            height: '12px', 
            background: '#FF6B6B',
            borderRadius: '50%',
            boxShadow: '0 0 10px #FF6B6B',
            display: 'inline-block'
          }}></span>
          Finish (1)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '12px', 
            height: '12px', 
            background: '#4A9EFF',
            borderRadius: '50%',
            boxShadow: '0 0 10px #4A9EFF',
            display: 'inline-block'
          }}></span>
          Trajectories
        </div>
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 'clamp(9px, 1.2vw, 11px)' }}>
          🖱️ Wheel: Zoom<br/>
          🖱️ Drag: Pan
        </div>
      </div>
    </div>
  );
};

export default CollatzVisualization;