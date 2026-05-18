# LevyFlow Edge Cases Log

## Initial Edge Cases (Initialized 2026-05-18)

### 1. Duplicate Matric Number Submissions
* **Description**: A student attempts to submit multiple payment proofs for the same matric number within the same campaign, or two different students input the same matric number by mistake.
* **Impact**: Could lead to double-counting or overwriting payment sessions.
* **Mitigation**: Implement a unique constraint check on `(campaign_id, matric_number)` in the `payment_sessions` table and return a `409 Conflict` status when a duplicate is submitted.

### 2. OCR / Document AI Receipt Processing Failure
* **Description**: An uploaded payment screenshot is blurry, corrupt, low-resolution, or belongs to an unsupported banking app, leading to failed OCR parsing or missing fields (e.g., empty sender name, incorrect amount).
* **Impact**: OCR processor crashes or yields `null` properties, resulting in unverified states.
* **Mitigation**: Wrap the OCR extraction in robust error handlers, set fields to `null` on failure, and automatically transition the session status to `manual_review` so a human administrator can inspect the screenshot.

### 3. Nigerian Name Ordering and Variation in Fuzzy Matching
* **Description**: Name spelling or ordering differs between the official school database and the bank account name (e.g., "Adeola Chukwuma Olatunji" vs. "Olatunji Adeola C.").
* **Impact**: Standard exact matches fail, causing unnecessary manual intervention.
* **Mitigation**: Implement a custom `FuzzyMatcher` that tokenizes names, strips non-word characters, normalizes to lowercase, and computes Jaccard token similarity alongside Levenshtein distance, mapping scores dynamically to `auto_verified` or `manual_review` status ranges based on configurable thresholds.
