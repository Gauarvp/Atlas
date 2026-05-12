"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Detection, DetectionState, getConfidenceColor } from "@/lib/data";
import { Check, X, Flag } from "lucide-react";

interface DetectionListProps {
  detections: Detection[];
  selectedDetectionId: string | null;
  onSelectDetection: (detectionId: string) => void;
  onUpdateState: (detectionId: string, state: DetectionState) => void;
}

export function DetectionList({
  detections,
  selectedDetectionId,
  onSelectDetection,
  onUpdateState,
}: DetectionListProps) {
  const reviewedCount = detections.filter((d) => d.state !== "pending").length;
  const progress = detections.length > 0 ? (reviewedCount / detections.length) * 100 : 0;

  if (detections.length === 0) {
    return (
      <div className="flex h-full w-96 flex-col border-l border-border bg-card">
        <div className="flex items-center border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Detections</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sm text-muted-foreground">
            No detections to review
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-96 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Detections
          </h2>
          <span className="text-sm text-muted-foreground">
            {reviewedCount} of {detections.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Detection cards */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 p-3">
          {detections.map((detection) => (
            <DetectionCard
              key={detection.id}
              detection={detection}
              isSelected={selectedDetectionId === detection.id}
              onSelect={() => onSelectDetection(detection.id)}
              onUpdateState={(state) => onUpdateState(detection.id, state)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function DetectionCard({
  detection,
  isSelected,
  onSelect,
  onUpdateState,
}: {
  detection: Detection;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateState: (state: DetectionState) => void;
}) {
  const colors = getConfidenceColor(detection.confidence);
  const confidencePercent = Math.round(detection.confidence * 100);

  // Confidence pill colors
  const pillClass = detection.confidence >= 0.8
    ? "bg-green-100 text-green-800"
    : detection.confidence >= 0.5
    ? "bg-amber-100 text-amber-800"
    : "bg-slate-100 text-slate-700";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-3 transition-all duration-150",
        "hover:border-border hover:shadow-sm",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/60"
      )}
    >
      {/* Top row: thumbnail + info + confidence */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-12 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted",
            colors.border
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={detection.thumbnailUrl}
            alt={detection.label}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium capitalize text-foreground">
            {detection.label}
          </span>
          <span className={cn(
            "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
            pillClass
          )}>
            {confidencePercent}% confidence
          </span>
        </div>
      </div>

      {/* Action buttons - full width row */}
      <div className="flex items-center gap-2">
        <ActionButton
          icon={Check}
          label="Accept"
          isActive={detection.state === "accepted"}
          activeClass="bg-green-600 text-white border-green-600 hover:bg-green-700"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateState(detection.state === "accepted" ? "pending" : "accepted");
          }}
        />
        <ActionButton
          icon={X}
          label="Reject"
          isActive={detection.state === "rejected"}
          activeClass="bg-red-600 text-white border-red-600 hover:bg-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateState(detection.state === "rejected" ? "pending" : "rejected");
          }}
        />
        <ActionButton
          icon={Flag}
          label="Flag"
          isActive={detection.state === "flagged"}
          activeClass="bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateState(detection.state === "flagged" ? "pending" : "flagged");
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  isActive,
  activeClass,
  onClick,
}: {
  icon: typeof Check;
  label: string;
  isActive: boolean;
  activeClass: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-9 flex-1 gap-1.5 rounded-lg border text-sm font-medium transition-all",
        isActive
          ? activeClass
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}