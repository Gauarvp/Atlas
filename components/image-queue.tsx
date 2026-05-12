"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ImageData } from "@/lib/data";

interface ImageQueueProps {
  images: ImageData[];
  selectedImageId: string | null;
  onSelectImage: (imageId: string) => void;
}

// Same util as in image-canvas.tsx — could be lifted to lib/utils but inline for speed
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

export function ImageQueue({ images, selectedImageId, onSelectImage }: ImageQueueProps) {
  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Queue</h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {images.length}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {images.map((image) => {
            const isSelected = selectedImageId === image.id;
            const reviewedCount = image.detections.filter(d => d.state !== "pending").length;
            const allReviewed = reviewedCount === image.detections.length && image.detections.length > 0;
            const humanName = humanizeFilename(image.filename);

            return (
              <button
                key={image.id}
                onClick={() => onSelectImage(image.id)}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition-all duration-150",
                  "hover:border-border hover:shadow-sm",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/60"
                )}
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.thumbnailUrl}
                    alt={image.filename}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {allReviewed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-success/80">
                      <span className="text-xs font-semibold text-white">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {humanName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {image.detections.length} detection{image.detections.length === 1 ? "" : "s"}
                    </span>
                    {reviewedCount > 0 && !allReviewed && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-primary font-medium">
                          {reviewedCount}/{image.detections.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}