# Atlas

A prototype analyst triage tool for AI-detected objects in overhead imagery. Built in 5 days as a self-initiated PM portfolio piece.

**Live demo:** [https://atlas-sandy-nine.vercel.app/]
**PRD:** [https://secret-lantana-c09.notion.site/Atlas-Analyst-Triage-Tool-for-AI-detected-Objects-35e12a84681f80edb5d7c508429711ed]
**Project walkthrough:** [https://www.loom.com/share/ec9fc2aac7fa47efa67414ca17ca7c04]

---

## What this is

An interface for an intelligence analyst to review, accept/reject, and dispatch AI-generated object detections on satellite or drone imagery. Optimizes for **time-to-dispatch under accuracy constraints** — the analyst is the bottleneck once the model is good enough, and the product lives in how fast verification can be made without collapsing trust.

This is not a real defense product. It's a 5-day prototype built to demonstrate product thinking, AI-native shipping, and taste in workflow design.

## What this isn't

- A trained custom model. Uses YOLOv8 pretrained, run offline.
- A production system. No auth, no real-time ingest, no multi-tenant.
- Tested with real analysts. The persona is desk-research, not user-research. v2 starts there.

## Design decisions

The PRD covers the trade-offs in detail. The three that mattered most:

1. **Pre-select high-confidence detections as ✓.** Saves clicks on the easy 70% but risks trust collapse if the model is wrong on something the UI presented as confident. Mitigated by logging every override.
2. **Color-code confidence; don't just show numbers.** Pre-attentive processing is faster than reading under time pressure. Numbers still on hover for analysts who want them.
3. **One-button dispatch, no confirmation modal.** Every confirmed detection has already been reviewed individually. Adding a modal adds friction without new information.

What I deliberately *didn't* build: a select-all button, auto-dispatch above a threshold, a confidence-tuning slider in the main UI. Each of those would have been faster to build and weakened the product.

## Stack

- Next.js 14 + Tailwind (UI scaffolded with v0.dev, then refined)
- Supabase (decision logging)
- YOLOv8m via Ultralytics (predictions generated offline, served as static JSON)
- Deployed on Vercel
- Sample data: xView dataset (public, Defense Innovation Unit)

## Metrics I'd instrument

- **Time-to-dispatch (TTD)** — north star, target <180s median
- **Analyst-confirmed precision** — counter-metric, target ≥95%
- **Override rate** on pre-selected detections — diagnoses model calibration
- **Flag rate** — calibrates how to surface uncertainty in v2

## What I'd build next

If this were continuing past the prototype:

1. Five real user interviews with analysts before any v2 spec
2. Override-driven model retraining loop
3. Multi-analyst handoff for flagged detections
4. Real-time ingest pipeline

## About this project

Built by [Sai Gowrav P](https://www.linkedin.com/in/saigauravp). I'm an analyst transitioning to product, and this is one of the prototypes I'm shipping in public to demonstrate the craft. Feedback welcome — DM me on LinkedIn.
