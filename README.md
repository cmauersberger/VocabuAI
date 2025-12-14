# VocabuAI

VocabuAI is a vocabulary learning app focused on Arabic (with potential future support for additional languages). Users build their own vocabulary list (flashcards) and study with an adaptive/spaced-repetition style flow: new and difficult items appear more often, well-known items less often.

In addition to classic vocabulary recall, VocabuAI supports AI-assisted learning modes:
- Handwriting input (draw Arabic letters/words) with recognition and answer checking
- Sentence-based practice where AI generates translation exercises based on the user’s known vocabulary and grammar concepts
- AI-assisted classification of vocabulary entries (verb, noun, pronoun, etc.) and difficulty-tuned multiple-choice distractors

## Concept Docs
- `concept/app-concept.md`
- `concept/ui-concept.md`

## Tech Stack
- Frontend: React Native (native Android app + web-based browser app)
- Backend: C# / ASP.NET + Entity Framework Core (latest)
- AI: multiple models (e.g., handwriting recognition + lesson/sentence generation and distractor generation)

## High-Level Components (Planned)
- Mobile/Web client: vocabulary management, study sessions (type/write/multiple-choice), sentence practice, progress stats
- API: authentication (required), vocabulary CRUD, study state/scheduling, analytics, AI orchestration endpoints
- Data layer: EF Core models + migrations, user/vocabulary/study state storage

## Repo Structure
- `concept/`: product and UI concept documents

## Status
This repository currently contains the conceptual documentation and is the starting point for implementation.
