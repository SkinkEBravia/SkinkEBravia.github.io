---
title: "OCR Fix: Addressable Interfaces for Document Editing"
authors: ["Yifan Zhang"]
venue: "Independent research"
year: 2026
abstract: >-
  Can the editing interface help a language agent correct a document without damaging
  text that is already right? OCR Fix studies stable identifiers, local edit scope,
  and the failure patterns that aggregate error scores can hide.
selected: true
draft: false
experimentResults: "ocr-fix"
---

## The idea

OCR correction is an editing problem: most of the document should survive unchanged.
I study how the interface between an agent and a document affects that balance.
Instead of asking the model to reproduce the whole text, an interface can expose
stable block identifiers and let the agent target a local replacement.

The harness represents documents in an intermediate representation, applies edits
atomically, and records content-addressable snapshots and action logs. A session
can be replayed deterministically without another model call, making unintended
changes easier to inspect.

## The experiment

I compared eight interface variants on **33 paired tasks**: 11 German DTA19 source
documents at three noise levels, with one model turn per task. The study covers
global find/replace, local patches, and full rewriting, with controls for visible
keys, key stability, and attention instructions. DeepSeek V4 Flash and V4.1 Flash
used the same tasks, endpoint, protocol, and generation parameters.

## What I observed

- **Local patching had a tighter observed tail than full rewriting in both versions.**
  P90 cMER was 0.0199 versus 0.0389 in V4, and 0.0187 versus 0.0245 in V4.1.
  Maximum cMER was 0.0295 versus 0.9648, and 0.0284 versus 0.0605, respectively.
- **Presentation and instructions are part of the interface.** Visible keys and
  attention instructions changed behavior; their effects depended on the model
  version and editing operation.
- **A typical score can hide a severe failure.** The full rewrite + keys variant
  reached a maximum cMER of 0.7483 in V4.1 despite a median of 0.0119.

These observations motivate evaluating editing interfaces by both correction
quality and damage to previously correct text. They remain exploratory results
from 11 source documents and two versions of one model family; the tail comparisons
below are descriptive statistics.
