// The AI coach runs on UpAiry's server, which holds the API key and the coach skill.
// The app sends only the question, recent chat and an anonymous summary (aiContext in logic.ts).
// Expected reply: { reply: "..." }. Empty until the server is live: answers come from the built-in guides.
export const COACH_URL = '';
