---
title: "Edit or cancel a scheduled post"
collection: "content"
summary: "Changes reach the posting service too."
cta: "Open Content"
to: "/content?view=queue"
---

Open a scheduled post from **Content → Queue**.
- **Edit:** make your changes and press **Save changes**. Muse cancels the post on every service it was sent to, then sends the new version. If any cancel fails, nothing is re-sent, so nothing posts twice.
- **Cancel post:** pulls it back everywhere and keeps it here as a draft.

Ayrshare deletes the scheduled post. Zapier, Make, n8n and webhooks receive `muse.post.cancelled`; your automation should remove its copy.
