# VocabuAI - UI Concept (High Level)

## UI Principles
- Fast "study loop": minimal taps to start/continue a session.
- RTL-first: correct Arabic rendering, alignment, and cursor behavior.
- Clear mode separation: vocabulary management vs. study vs. sentence practice.
- Low-friction data entry: quick add, optional fields tucked away.
- Consistent answer UX: same evaluation and feedback patterns for typing, handwriting, and multiple choice.

## Major Top-Level Screens

### 1) Onboarding / Setup
- Choose target language (Arabic for MVP).
- Pick input preferences (Arabic keyboard, transliteration acceptance).
- Choose study preference defaults (free-form vs. multiple choice, strict vs. lenient checking).
- Optional: short RTL + handwriting calibration tutorial.

### 2) Home / Dashboard
- Primary CTAs: `Continue studying`, `Start study session`, `Sentence practice`, `Add vocabulary`.
- At-a-glance stats: due now, new words available, streak, recent accuracy.

### 3) Vocabulary Library (Decks / Lists)
- List of decks (or one default "My Arabic" deck for MVP).
- Search and filters (tags, word type, difficulty, new/due/learned).
- Entry list view with quick actions (edit, suspend, reset progress).

### 4) Add / Edit Vocabulary
- Required fields: Arabic text, meaning/translation.
- Optional fields: transliteration, notes, tags, examples.
- Auto-classification display (word type) with user override.
- Quick-add flow: add multiple items in sequence.

### 5) Study Session
- Card view with:
  - Prompt (Arabic/meaning/audio if added)
  - Answer input selector: `Type`, `Write`, `Multiple choice`
  - Submit + reveal/correction UI
- Feedback (inline or after submit):
  - Correct/incorrect, show expected answer, show recognized handwriting text (if used)
  - Optional self-grade buttons (e.g., `Again / Hard / Good / Easy`)
- Navigation: next card, pause/end session, session progress indicator.

### 6) Handwriting Canvas (Part of Study)
- Full-width writing area, undo, clear, show recognition result, "edit recognized text" option.
- Optional per-letter practice entry point (later).

### 7) Sentence Practice
- Task view: generated sentence + instruction ("Translate to ...").
- Answer input selector: typing, handwriting, or multiple choice (if supported for sentences later).
- Optional hints: highlight used words, show relevant known vocabulary.
- Regenerate / report issue actions (to handle odd AI outputs).

### 8) Grammar Concepts (Progress / Unlocks)
- List of concepts with status: locked / learning / known.
- Simple explanations and example sentences.
- Controls to mark as known (or quiz-based unlocking later).

### 9) Progress / Statistics
- Daily/weekly activity, retention/accuracy, time spent.
- Breakdown by deck, tag, and word type.
- "Leech" list (items repeatedly missed) with remediation suggestions.

### 10) Settings
- Answer checking: strict/lenient, diacritics handling, accepted variants/synonyms.
- Study behavior: session length, new-per-day, input defaults, multiple choice difficulty.
- Language/dialect options (future).
- Data: export/import, backup/sync (future).

## Navigation Model (Suggestion)
- Bottom navigation: `Home`, `Study`, `Vocabulary`, `Practice`, `Stats`
- Settings accessible from Home toolbar or profile icon.

## Key UI States
- Empty state: no vocabulary yet -> guided "add your first words" flow.
- Offline state: study works; AI features disabled or queued with clear messaging.
- Error recovery: handwriting recognition uncertainty prompts user to confirm/edit.
