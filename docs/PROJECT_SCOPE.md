# Project Scope

## Public demo

The public Readly demo is intentionally browser-only. It includes a complete SaaS-style marketing homepage, a clearly labeled portfolio-demo access screen, and an OCR workspace. It accepts PDF, PNG, and JPG files up to 10 MB, processes the first PDF page, uses an English OCR model, and lets the visitor review and export the result. Files and demo passwords are not uploaded or retained.

## Premium client implementation

For a buyer project, the same interface can connect to a Python and FastAPI service with OpenCV preprocessing, a specialized OCR provider, authentication, queues, persistent audit history, additional languages, multi-page batch processing, and private cloud deployment.

## Why the split matters

The browser demo is inexpensive to host and safe to share publicly. The premium backend remains a custom deliverable whose architecture can match the buyer's document volume, privacy obligations, target accuracy, and integration requirements.
