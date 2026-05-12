"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Detection, ImageData, getConfidenceColor } from "@/lib/data";
import { Send } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface ImageCanvasProps {
  image: ImageData | null;
  selectedDetectionId: string | null;
  onSelectDetection: (detectionId: string) => void;
  allReviewed: boolean;
}

// Convert filename like "IMG-20260511-BRG-01.jpg" to a human-readable label
function humanizeFilename(filename: string): string {
  const sectorMap: Record<string, string> = {
    BRG: "Bridge sector",
    HWY: "Highway sector",
    PORT: "Port sector",
    URBN: "Urban sector",
    DPOT: "Depot sector",
  };
  const match = filename.match(/IMG-\d+-(\w+)-(\d+)/);
  if (match) {
    const sector = sectorMap[match[1]] || match[1];
    return `${sector} ${match[2]}`;
  }
  return filename;
}

export function ImageCanvas({
  image,
  selectedDetectionId,
  onSelectDetection,
  allReviewed,
}: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !image) return;
    const updateScale = () => {
      if (!containerRef.current || !image) return;
      const containerWidth = containerRef.current.clientWidth - 64;
      const containerHeight = containerRef.current.clientHeight - 64;
      const scaleX = containerWidth / image.width;
      const scaleY = containerHeight / image.height;
      setScale(Math.min(scaleX, scaleY, 2));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [image]);

  useEffect(() => {
    setImageLoaded(false);
  }, [image?.id]);

  if (!image) {
    return (
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex h-16 items-center border-b border-border px-6" />
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm text-muted-foreground">
            Select an image from the queue to begin
          </span>
        </div>
      </div>
    );
  }

  const reviewedCount = image.detections.filter(d => d.state !== "pending").length;
  const humanName = humanizeFilename(image.filename);

  return (
    <div className="flex flex-1 flex-col bg-background min-w-0">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-mono text-sm font-semibold text-primary-foreground">A</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">Atlas</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {humanName}
            </span>
            <span className="text-xs text-muted-foreground">
              {image.detections.length} detections to review
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {reviewedCount} of {image.detections.length} reviewed
          </span>
          <Button
            size="default"
            disabled={!allReviewed}
            onClick={() => {
              const accepted = image.detections.filter(d => d.state === "accepted");
              console.log("[Atlas] Dispatched report:", {
                image: image.filename,
                confirmed: accepted.length,
                rejected: image.detections.filter(d => d.state === "rejected").length,
                flagged: image.detections.filter(d => d.state === "flagged").length,
              });
              alert(`Dispatched ${accepted.length} confirmed detection${accepted.length === 1 ? "" : "s"} for ${humanName}`);
            }}
            className={cn(
              "h-10 gap-2 rounded-lg px-5 text-sm font-medium transition-all",
              allReviewed
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "opacity-50"
            )}
          >
            <Send className="h-4 w-4" />
            Dispatch report
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-hidden bg-muted/30 p-8"
      >
        <div
          className="relative rounded-xl bg-white shadow-sm ring-1 ring-border/40"
          style={{
            width: image.width * scale,
            height: image.height * scale,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.fullUrl}
            alt={image.filename}
            className={cn(
              "absolute inset-0 h-full w-full rounded-xl transition-opacity duration-200",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />

          {imageLoaded &&
            image.detections.map((detection) => (
              <BoundingBox
                key={detection.id}
                detection={detection}
                scale={scale}
                isSelected={selectedDetectionId === detection.id}
                onClick={() => onSelectDetection(detection.id)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function BoundingBox({
  detection,
  scale,
  isSelected,
  onClick,
}: {
  detection: Detection;
  scale: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = getConfidenceColor(detection.confidence);
  const confidencePercent = Math.round(detection.confidence * 100);

  const stateClasses = {
    accepted: "opacity-100",
    rejected: "opacity-30",
    flagged: "opacity-100",
    pending: "opacity-90",
  }[detection.state];

  const labelOnTop = detection.bbox.y * scale > 28;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group absolute cursor-pointer transition-all duration-150",
        "border-2 rounded-sm",
        colors.border,
        stateClasses,
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-white z-10"
      )}
      style={{
        left: detection.bbox.x * scale,
        top: detection.bbox.y * scale,
        width: detection.bbox.width * scale,
        height: detection.bbox.height * scale,
        backgroundColor: colors.fill,
      }}
    >
      <div
        className={cn(
          "absolute flex items-center gap-1 rounded-md border px-2 py-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100 pointer-events-none shadow-sm bg-white",
          isSelected && "opacity-100",
          colors.border,
          labelOnTop ? "-top-7" : "top-full mt-1",
          "left-0"
        )}
      >
        <span className={cn("text-xs font-medium capitalize", colors.text)}>
          {detection.label}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="font-mono text-xs text-foreground">
          {confidencePercent}%
        </span>
      </div>
    </button>
  );
}