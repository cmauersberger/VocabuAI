# VocabuAI (Android) — App Concept

## 1. Overview
VocabuAI is an Android app for learning Arabic vocabulary (with potential future support for additional languages). Users create their own vocabulary entries, similar to a classic index-card/flashcard system. The app then schedules reviews so that new and difficult words appear more frequently, while well-known words are asked less often.

In addition to direct “word → translation” practice, VocabuAI also supports a sentence-based learning mode: the app generates short sentences to translate, using only vocabulary and grammar concepts the user has already learned (or is currently learning).

## 2. Goals
- Make it fast and frictionless for users to build a personal vocabulary set.
- Improve retention using spaced repetition and adaptive difficulty.
- Support multiple answer modalities: keyboard typing and handwritten letter input.
- Provide more natural practice via sentence translation tasks generated with AI.
- Automatically categorize vocabulary (verbs, nouns, pronouns, etc.) to improve filtering and exercise generation.

## 3. Target Users
- Beginners and intermediate learners of Arabic who want to build an active vocabulary.
- Learners who prefer writing practice (Arabic script) in addition to typing.
- Users who want study material tailored to their personal word list.

## 4. Core Modes

### 4.1 Vocabulary Management (Create/Organize)
Users add vocabulary items (at minimum: Arabic word/phrase and meaning/translation). The app:
- Stores metadata (e.g., transliteration, example, notes, tags, dialect, plural/verb form).
- Automatically classifies the entry type (noun/verb/pronoun/particle, etc.).
- Optionally lets the user correct or refine the classification.

### 4.2 Study Mode (Flashcards / Recall)
The app presents prompts and checks the user’s answer. Users can choose how to answer:
- Free-form (typing or handwriting)
- Multiple choice
- Prompt types (examples):
  - Arabic → meaning (active recall)
  - Meaning → Arabic (production)
  - Optional: Arabic (audio) → meaning / Arabic spelling
- Scheduling:
  - New words appear often at first.
  - Words answered incorrectly (or slowly) increase in frequency.
  - Words answered correctly repeatedly are shown less frequently.

### 4.3 Sentence Mode (AI-Assisted Translation)
The app generates sentences to translate using:
- Vocabulary the user already knows (or is currently studying).
- Grammar concepts the user has unlocked (e.g., present tense, past tense, simple negation, adjective agreement, relative clauses).

The goal is to bridge isolated vocabulary study into contextual usage while keeping difficulty controlled.

## 5. Answer Input & Evaluation

### 5.1 Keyboard Input
- Standard typing input for Arabic script and/or transliteration (configurable).
- Flexible grading options:
  - Strict matching (exact)
  - Lenient matching (ignoring diacritics, allowing minor spelling variants)
  - Accept synonyms/alternate translations (user-managed)

### 5.2 Handwriting Input (Drawing Letters)
Users can draw Arabic letters/words on-screen.
- The app uses handwriting recognition (“image reconnaissance”) to convert strokes to text.
- The recognized output is then evaluated against the expected answer using the same grading logic as keyboard input.
- UX considerations:
  - Clear canvas, undo stroke, show recognition result, allow manual correction.
  - Optional per-letter practice mode (useful for early learners).

### 5.3 Multiple Choice Answers
In study mode, users can opt for multiple choice instead of free-form input.
- Distractor answers are auto-generated (AI-assisted) and can be tuned by difficulty.
- Easier distractors: clearly different meanings/words.
- Harder distractors: semantically similar wrong answers, confusable spellings, or distractors of the same word type (e.g., nouns vs. nouns, verbs vs. verbs).

## 6. Adaptive Scheduling (Conceptual Model)
Study items maintain a “memory strength” signal that determines when they should next appear. A typical approach combines:
- **Spaced repetition interval** (grows with consistent correct answers)
- **Ease/difficulty score** (drops after mistakes; rises after confident correct answers)
- **Recency** (recently studied items are less likely to appear immediately again)

Example (conceptual, not an implementation requirement):
- Each review produces a grade: `again / hard / good / easy` (or computed from correctness + response time).
- Update interval and ease accordingly.
- Select next cards by priority score (overdue first, then new, then “at risk”).

## 7. Automatic Vocabulary Classification
When a user adds an entry, the app assigns a grammatical type, such as:
- Verb, noun, adjective, pronoun, preposition, conjunction, particle, expression/phrase

Uses for classification:
- Better organization and filtering.
- More targeted exercises (e.g., verb conjugation drills).
- Sentence generation constraints (choose structures that match known grammar).

Classification can be:
- Rule-based (patterns, known affixes) + AI-assisted classification.
- User-correctable with the correction saved to improve future predictions.

## 8. Grammar Knowledge Tracking (For Sentence Mode)
The user profile tracks which grammar concepts are “known” or “in progress”, such as:
- Tense/aspect: present, past
- Negation patterns
- Gender/number agreement basics
- Possessive constructions (e.g., iḍāfa)
- Relative clauses
- Prepositions and common particles

Sentence generation uses this set as constraints to keep sentences appropriate.

## 9. Data (High-Level)
Suggested conceptual entities (names are illustrative):
- **User**
- **VocabularyItem**
  - `id`, `arabicText`, `meaning`, `transliteration?`, `type`, `notes?`, `tags?`
- **StudyState**
  - `vocabId`, `lastReviewedAt`, `interval`, `ease`, `dueAt`, `lapseCount`, `streak`
- **GrammarConcept**
  - `conceptId`, `status` (locked / learning / known)
- **ExerciseAttempt**
  - `exerciseType`, `prompt`, `expected`, `userInput`, `recognizedInput?`, `result`, `timestamp`

## 10. Non-Functional Requirements (Conceptual)
- Offline-first study experience (with optional sync later).
- Fast review loop (minimal taps between cards).
- Privacy-aware AI usage (clear disclosure when external inference is used).
- Accessibility considerations (font sizing, right-to-left UI correctness).

## 11. Roadmap Ideas
- MVP: add vocabulary, basic study mode, simple scheduling, typed answers.
- Handwriting input with recognition and correction UX.
- Automatic classification and user correction.
- Sentence mode with grammar gating and “known words only” generation.
- Optional: audio (TTS) prompts and listening exercises.

## 12. Open Questions
- Should answers accept transliteration, Arabic, or both (per deck setting)?
- How to handle dialect vs. MSA (separate decks/tags, separate classification rules)?
- What level of leniency is appropriate (diacritics, hamza variants, spelling variants)?
- Offline vs. online AI: on-device model vs. server inference; cost and privacy tradeoffs.
