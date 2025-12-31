import { useEffect, useRef } from "react";

interface AudioVisualizerCSSProps {
  isActive: boolean;
  analyzerNode?: AnalyserNode | null;
}

const AudioVisualizerCSS = ({ isActive, analyzerNode }: AudioVisualizerCSSProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !analyzerNode || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyzerNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyzerNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 32;
      const barWidth = canvas.width / barCount - 2;
      const barSpacing = 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * canvas.height * 0.8;

        const x = i * (barWidth + barSpacing);
        const y = canvas.height - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        gradient.addColorStop(0, "#00d9ff");
        gradient.addColorStop(0.5, "#8b5cf6");
        gradient.addColorStop(1, "#ff0080");

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00d9ff";

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyzerNode]);

  if (!isActive) {
    return (
      <div className="visualizer-static">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="visualizer-bar"
            style={{
              height: `${Math.random() * 30 + 10}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="visualizer-canvas"
    />
  );
};

export default AudioVisualizerCSS;
