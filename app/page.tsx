"use client";

import { useState, useCallback, useEffect } from "react";
import { ImageQueue } from "@/components/image-queue";
import { ImageCanvas } from "@/components/image-canvas";
import { DetectionList } from "@/components/detection-list";
import { adaptPredictions, ImageData, DetectionState } from "@/lib/data";

export default function AtlasPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load predictions.json on mount
  useEffect(() => {
    fetch("/predictions.json")
      .then((r) => r.json())
      .then((raw) => {
        const adapted = adaptPredictions(raw);
        const withDefaults = adapted.map((img) => ({
          ...img,
          detections: img.detections.map((det) => ({
            ...det,
            state: (det.confidence >= 0.8 ? "accepted" : "pending") as DetectionState,
          })),
        }));
        setImages(withDefaults);
        if (withDefaults.length > 0) {
          setSelectedImageId(withDefaults[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load predictions:", err);
        setLoading(false);
      });
  }, []);

  const selectedImage = images.find((img) => img.id === selectedImageId) || null;

  const allReviewed = selectedImage
    ? selectedImage.detections.every((d) => d.state !== "pending")
    : false;

  const handleSelectImage = useCallback((imageId: string) => {
    setSelectedImageId(imageId);
    setSelectedDetectionId(null);
  }, []);

  const handleSelectDetection = useCallback((detectionId: string) => {
    setSelectedDetectionId(detectionId);
  }, []);

  const handleUpdateDetectionState = useCallback(
    (detectionId: string, state: DetectionState) => {
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          detections: img.detections.map((det) =>
            det.id === detectionId ? { ...det, state } : det
          ),
        }))
      );
    },
    []
  );

  // Auto-select first detection when image changes
  useEffect(() => {
    if (selectedImage && selectedImage.detections.length > 0 && !selectedDetectionId) {
      setSelectedDetectionId(selectedImage.detections[0].id);
    }
  }, [selectedImage, selectedDetectionId]);

  // Helper: move selection to next/previous detection
  const moveDetection = useCallback((direction: 1 | -1) => {
    if (!selectedImage) return;
    const list = selectedImage.detections;
    if (list.length === 0) return;
    const currentIdx = list.findIndex(d => d.id === selectedDetectionId);
    const nextIdx = currentIdx === -1
      ? 0
      : (currentIdx + direction + list.length) % list.length;
    setSelectedDetectionId(list[nextIdx].id);
  }, [selectedImage, selectedDetectionId]);

  // Keyboard shortcuts: Y/N/F to mark, J/K or ↑/↓ to navigate, [/] to switch image
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();

      // Mark current detection
      if (selectedDetectionId) {
        if (key === "y") {
          e.preventDefault();
          handleUpdateDetectionState(selectedDetectionId, "accepted");
          moveDetection(1);
          return;
        }
        if (key === "n") {
          e.preventDefault();
          handleUpdateDetectionState(selectedDetectionId, "rejected");
          moveDetection(1);
          return;
        }
        if (key === "f") {
          e.preventDefault();
          handleUpdateDetectionState(selectedDetectionId, "flagged");
          moveDetection(1);
          return;
        }
      }

      // Navigate detections: J/down = next, K/up = prev
      if (key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        moveDetection(1);
        return;
      }
      if (key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        moveDetection(-1);
        return;
      }

      // Switch images: [ = previous, ] = next
      if (key === "]" || key === "}") {
        e.preventDefault();
        const idx = images.findIndex(i => i.id === selectedImageId);
        if (idx >= 0 && idx < images.length - 1) {
          handleSelectImage(images[idx + 1].id);
        }
        return;
      }
      if (key === "[" || key === "{") {
        e.preventDefault();
        const idx = images.findIndex(i => i.id === selectedImageId);
        if (idx > 0) {
          handleSelectImage(images[idx - 1].id);
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedDetectionId, selectedImage, selectedImageId, images, handleUpdateDetectionState, moveDetection, handleSelectImage]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
        Loading predictions…
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
        No predictions loaded. Check that /predictions.json exists in public/.
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ImageQueue
        images={images}
        selectedImageId={selectedImageId}
        onSelectImage={handleSelectImage}
      />
      <ImageCanvas
        image={selectedImage}
        selectedDetectionId={selectedDetectionId}
        onSelectDetection={handleSelectDetection}
        allReviewed={allReviewed}
      />
      <DetectionList
        detections={selectedImage?.detections || []}
        selectedDetectionId={selectedDetectionId}
        onSelectDetection={handleSelectDetection}
        onUpdateState={handleUpdateDetectionState}
      />
    </div>
  );
}