---
title: "Posting services"
collection: "content"
summary: "Ayrshare, Zapier, Make, n8n or a webhook: which to use."
cta: "Open Connections"
to: "/settings?section=connections"
---

Muse doesn't post directly to social networks. It sends each post to a **posting service** you connect:

- **Ayrshare:** posts and schedules for you, supports Reels and Stories, first comments, editing and cancelling, and **stats**.
- **Zapier, Make, n8n:** Muse sends the post as JSON to your automation (event `muse.post`). Cancelling sends `muse.post.cancelled` with the same `postId`. These can't report stats back.
- **Custom webhook:** any https endpoint that accepts JSON. An optional secret signs each request (`X-Muse-Signature`).

Each social account picks its own service in **Settings → Social accounts**. Test a connection with **Test connection** or **System check**.
