export const releaseNotes = `## tsumikit 0.62

The conversation release: everything needed to build an assistant panel, still with **zero runtime dependencies**.

### Highlights

- \`ConversationFeed\` sticks to the bottom and keeps the viewport still when history loads
- \`Composer\` gains a toolbar row and prompt history
- \`renderMarkdown\` turns chat text into safe HTML for \`Prose\`

> Upgrading from 0.61? Nothing breaks: every new prop is optional.

| Component | Change | Breaking |
|---|---|---|
| ChatBubble | \`timestamp\`, \`footer\`, \`markdown\` | no |
| StatusBar | new | no |
| DataTable | \`responsive="stack"\` | no |

\`\`\`ts
import { renderMarkdown } from '@dorsk/tsumikit';
const html = renderMarkdown(message.text);
\`\`\`

Full changelog on [GitHub](https://github.com/DorskFR/tsumikit/releases), or see https://dorskfr.github.io/tsumikit for the demo.`;

export const hostile = `Links are scheme-checked: [docs](https://dorskfr.github.io/tsumikit) and [mail](mailto:ops@example.com) work, [click me](javascript:alert(1)) stays text.

Raw HTML is escaped: <img src=x onerror=alert(1)> <script>alert(1)</script>

An unbroken token wraps: sha256:9f12e485513e4d6eb987d81a95cead559f12e485513e4d6eb987d81a95cead55

| Six columns | that wrap | their cells | instead of | widening | the page |
|---|---|---|---|---|---|
| api-gateway-eu-west-1 | worker-02-eu-west-1 | cache-01-us-east-1 | postgres-primary | media-transcode | search-index |

\`\`\`sh
kubectl -n cyberia logs deploy/api-gateway --since=1h --timestamps --all-containers --prefix | grep -E "5[0-9]{2}" | tail -n 200
\`\`\``;
