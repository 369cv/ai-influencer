---
title: "System check"
collection: "settings"
summary: "Test every connection with one small real request."
cta: "Run System check"
to: "/settings?section=check"
---

**Settings → System check** sends one small real request per connection and keeps the result:
- **Higgsfield:** sign-in and tool list, no credits
- **Claude:** a five-token reply
- **ElevenLabs:** lists voices, no characters
- **Posting services:** linked accounts (Ayrshare) or a `muse.test` event (webhooks); nothing is posted

Failures show the reason and a **Fix** link to that connection. A failed check also appears in **Needs you**.
