export type DetectionState = "pending" | "accepted" | "rejected" | "flagged";

export interface Detection {
  id: string;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  state: DetectionState;
  thumbnailUrl: string;
}

export interface ImageData {
  id: string;
  filename: string;
  width: number;
  height: number;
  thumbnailUrl: string;
  fullUrl: string;
  detections: Detection[];
}

// ---- Raw YOLO output shape (matches predictions.json) ----
interface RawDetection {
  id: string;
  label: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number }; // normalized 0-1
}

interface RawImage {
  image: string; // filename
  width: number;
  height: number;
  detections: RawDetection[];
}

// ---- Adapter: converts YOLO output -> v0's ImageData shape ----
export function adaptPredictions(raw: RawImage[]): ImageData[] {
  return raw.map((img, idx) => ({
    id: `img-${String(idx + 1).padStart(3, "0")}`,
    filename: img.image,
    width: img.width,
    height: img.height,
    thumbnailUrl: `/images/${img.image}`,
    fullUrl: `/images/${img.image}`,
    detections: img.detections.map((det) => ({
      id: det.id,
      label: det.label,
      confidence: det.confidence,
      bbox: {
        x: Math.round(det.bbox.x * img.width),
        y: Math.round(det.bbox.y * img.height),
        width: Math.round(det.bbox.w * img.width),
        height: Math.round(det.bbox.h * img.height),
      },
      state: "pending" as DetectionState,
      thumbnailUrl: `/crops/${det.id}.jpg`,
    })),
  }));
}

// Empty default; the real data loads at runtime in page.tsx
export const mockImages: ImageData[] = [];

export function getConfidenceColor(confidence: number): {
  bg: string;
  border: string;
  text: string;
  fill: string;
} {
  if (confidence >= 0.8) {
    return {
      bg: "bg-success/20",
      border: "border-success",
      text: "text-success",
      fill: "rgba(74, 222, 128, 0.15)",
    };
  } else if (confidence >= 0.5) {
    return {
      bg: "bg-warning/20",
      border: "border-warning",
      text: "text-warning",
      fill: "rgba(251, 191, 36, 0.15)",
    };
  } else {
    return {
      bg: "bg-low-confidence/20",
      border: "border-low-confidence",
      text: "text-low-confidence-foreground",
      fill: "rgba(100, 116, 139, 0.15)",
    };
  }
}

export function getHighestConfidenceLabel(detections: Detection[]): string {
  if (detections.length === 0) return "";
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  return sorted[0].label;
}