# Muse Studio — Brand & Design System

Tags: `brand` · `design-tokens` · `ui` · `muse-studio` · `redesign`
Related: [`src/design/tokens.json`](../../src/design/tokens.json) (source of truth) ·
[`src/design/tokens.css`](../../src/design/tokens.css) (generated) ·
[Mobbin collection: Muse Studio – Redesign](https://mobbin.com/collections/4d67ec64-2c83-4904-9f30-cc90e820aca3/mobile/screens)

## Index

| Section | What it holds |
|---|---|
| [Direction](#direction) | The design idea in one paragraph |
| [Identity](#identity) | Name, logo, what not to copy |
| [Tokens](#tokens) | Color, type, shape, spacing, and how to change them |
| [Patterns](#patterns) | Layout and component patterns to build next |
| [Formats & workflow](#formats--workflow) | Which file formats to use and how tools plug in |
| [References](#references) | Where each pattern came from |

## Direction

**Calm AI studio.** A quiet light canvas with one soft violet-blue glow behind the
main action. Pill-shaped controls, tonal (tinted) buttons instead of loud solid ones,
big light headings, and small quiet labels. The influencer photos are the color; the
interface stays neutral. The direction is inspired by Google's current AI product
language (Gemini, Workspace Studio), but the brand is original.

## Identity

- **Name:** Muse Studio
- **Logo:** `public/icon.svg` (master copy in `src/design/muse-logo.svg`). It is a rounded
  square with the violet→blue gradient, two white arches forming an "M", and a
  four-point spark above them for the spark of inspiration.
- **App icons:** `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` and
  `apple-touch-icon.png` are rendered from the SVG.
- **Do not use:** Google, Gemini or Workspace names, the four-color Google palette,
  the Gemini sparkle, or Google Sans. The style is borrowed, never the brand.

## Tokens

The tokens use the W3C Design Tokens (DTCG) JSON format, which is portable to Figma
Tokens Studio, Style Dictionary, Tailwind and plain CSS.

| Group | Key values |
|---|---|
| Brand | violet `#7C5CFF` → blue `#3D8BFF` (gradient at 135°) |
| Accent | light `#5B4BEF` · dark `#A9A2FF` |
| Tonal button | light `#E7E4FF` on `#221A66` · dark `#2C2858` on `#E4E1FF` |
| Canvas | light `#F8F9FC` / surface `#FFFFFF` · dark `#111114` / surface `#1A1A1F` |
| Text | light `#1B1B1F` / `#5D5E66` / `#9A9BA3` · dark `#E6E6EB` / `#A9AAB3` / `#6F7079` |
| Font | Figtree (self-hosted, works offline); display 44px, weight 400 |
| Radius | 8 · 12 · 20 · 28 · pill 999 |
| Spacing | 4 · 8 · 12 · 16 · 24 · 32 · 48 |
| Layout | nav 56px · sidebar 264px (64px collapsed) · content max 1200px |

**To change a token:** edit `tokens.json`, then run `npm run tokens`. The build also
regenerates the CSS automatically. Use the tokens in code as `var(--accent)`,
`var(--tonal)`, `var(--radius-pill)`, `var(--glow)` and so on. Existing variable names
(`--bg`, `--surface`, `--text-primary`…) were kept, so current pages pick up the new
palette without code changes.

**Theme:** new visitors start in light mode; returning visitors keep the theme
they chose.

## Patterns

These are the next pieces to build, as one component each:

| Component | Pattern |
|---|---|
| App shell | Collapsible left sidebar (New, Influencers, Content, Videos, Brand Deals, Inspiration, recents); bottom tab bar on phones |
| Home | Greeting plus one pill prompt box (`+` upload, model picker, mic) over `--glow` |
| Plan card | Tonal card listing steps (poses, outfits, model, credit cost) with *Edit plan* / *Start* |
| Buttons | Pill: filled (`--accent`), tonal (`--tonal`), text |
| Chips | Pill filters and quick actions |
| Toast | `--toast-bg`, bottom-left, short text |
| Row menu | Three-dot menu on list rows (rename, pin, delete) |
| Template gallery | Workflow templates, e.g. *photo → caption → voice → talking clip → post* |

## Formats & workflow

| Need | Best format | Why |
|---|---|---|
| Design tokens | **DTCG JSON** → generated CSS variables | One source of truth that works with any tool |
| Page or reference extraction | **JSON** (structure, colors, fonts) plus a **screenshot** | JSON gives exact values; the screenshot gives layout and feel |
| Copy and content | **Markdown** | Portable and easy to diff |
| Components | **React + Tailwind** (21st.dev output) mapped to the tokens | Fits the code generators directly |
| Visual references | **Mobbin collection** links | Shareable and kept up to date |

## References

- Google Gemini web, [home with prompt box](https://mobbin.com/screens/f3b9012f-3f75-433b-a9e0-c70c2a39e9bc)
  and [Deep Research plan card](https://mobbin.com/screens/c7dbab4c-ec0a-43f3-a888-f8c21e5be86b)
- Instagram, [Creating an avatar](https://mobbin.com/flows/02d87bb6-d563-4939-8b3e-0ac1df83f57c): live preview with a pull-up panel of tabbed option grids
- Character AI, [Creating a character](https://mobbin.com/flows/c6596ed1-43af-4fed-afc9-a77a0571c2fc): one task per screen, Back/Next pinned at the bottom
- TikTok, [AI image creation](https://mobbin.com/flows/c3219fdc-e42e-4baf-b558-9c82c19e3e34): template gallery and a prompt-plus-photo composer
- studio.workspace.google.com was **not** inspected directly, because this session's
  network blocks it. Allow the domain in the environment settings to extract its exact
  values.
