import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
  analyzerNode?: AnalyserNode | null;
}

const AudioVisualizer = ({ isActive, analyzerNode }: AudioVisualizerProps) => {
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

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        gradient.addColorStop(0, "hsl(190, 100%, 50%)");
        gradient.addColorStop(0.5, "hsl(270, 70%, 60%)");
        gradient.addColorStop(1, "hsl(330, 100%, 50%)");

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "hsl(190, 100%, 50%)";

        // Rounded bars
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
    // Static bars when not active
    return (
      <div className="flex items-end justify-center gap-1 h-16 px-4">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-primary/20 to-secondary/20 rounded-full"
            style={{
              height: `${Math.random() * 30 + 10}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full h-20 overflow-hidden rounded-lg">
      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        className="w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
    </div>
  );
};

export default AudioVisualizer;
