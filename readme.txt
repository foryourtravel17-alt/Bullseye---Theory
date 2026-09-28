BULLSEYE THEORY — GLOBAL TRADING EDUCATION PLATFORM

Current course foundation:
- Premium dark student landing page
- Individual email/password authentication
- Student dashboard with course-access status
- Supabase-backed profiles and manual course activation
- Account-based lesson progress
- Quiz attempt records
- Certificate foundation
- Native Lesson 1: What Is Trading?
- Native Lesson 2: How Financial Markets Work
- Compulsory quizzes for Lessons 1–2
- Raw source PDFs/PPTX retained as source material during development

Course roadmap:
Login → Student Dashboard → 10 Native Lessons → Progress → Compulsory Quizzes → Certificate → Practical Tools → Videos → Journal

Security notes:
- Browser uses only the Supabase publishable key.
- Student data is protected with Supabase Auth/RLS policies.
- Admin activation and certificate issuance should be handled with server-side controls before production launch.
- Raw PDFs/PPTX should eventually be removed from the student-facing production path. Browser content cannot be made 100% impossible to copy or screenshot.

Educational disclaimer:
Bullseye Theory content is educational only and is not financial advice or a recommendation to buy or sell any asset. Trading involves substantial risk of loss.

Motion system build: 2026-09-29 cinematic Bullseye v3
