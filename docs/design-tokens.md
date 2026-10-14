# Design tokens

<!-- GENERATED from design/tokens/*.json — run `node design/build-tokens.mjs`. -->

Edit the JSON in `design/tokens/`, regenerate, and both apps move together.
Never edit the generated files:

- `autopark/web/src/styles/theme.css`
- `autopark/mobile/lib/design/app_tokens.g.dart`

## Colour

| Token | Light | Dark |
|---|---|---|
| `primary` | `#0F2A4A` | `#2B5586` |
| `primary-hover` | `#0A1C33` | `#4571A6` |
| `primary-soft` | `#F2F6FB` | `#0A1C33` |
| `on-primary` | `#FFFFFF` | `#FFFFFF` |
| `accent` | `#C8961E` | `#E3AC33` |
| `accent-soft` | `#FDF8EC` | `#583C17` |
| `on-accent` | `#0F172A` | `#0F172A` |
| `bg` | `#F8FAFC` | `#080F1C` |
| `surface` | `#FFFFFF` | `#0F172A` |
| `surface-alt` | `#F1F5F9` | `#1E293B` |
| `border` | `#E2E8F0` | `#334155` |
| `border-strong` | `#CBD5E1` | `#475569` |
| `text` | `#0F172A` | `#F8FAFC` |
| `text-muted` | `#64748B` | `#94A3B8` |
| `text-inverse` | `#FFFFFF` | `#0F172A` |
| `success` | `#059669` | `#6EE7B7` |
| `warning` | `#D97706` | `#FCD34D` |
| `danger` | `#DC2626` | `#FCA5A5` |
| `danger-hover` | `#B91C1C` | `#FECACA` |
| `focus` | `#6B93C2` | `#98B7DA` |
| `parking-normal` | `#4571A6` | `#98B7DA` |
| `parking-street` | `#C8961E` | `#E3AC33` |
| `spot-free` | `#047857` | `#6EE7B7` |
| `spot-free-bg` | `#ECFDF5` | `#06301F` |
| `spot-reserved` | `#B45309` | `#FCD34D` |
| `spot-reserved-bg` | `#FFFBEB` | `#3A2A06` |
| `spot-occupied` | `#B91C1C` | `#FCA5A5` |
| `spot-occupied-bg` | `#FEF2F2` | `#3A1212` |
| `spot-overstay` | `#991B1B` | `#FECACA` |
| `spot-overstay-bg` | `#FEE2E2` | `#4A1414` |
| `spot-blocked` | `#475569` | `#CBD5E1` |
| `spot-blocked-bg` | `#F1F5F9` | `#1E293B` |

## Scales

| Scale | Values |
|---|---|
| space | 0=0px, 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px, 10=40px, 12=48px, 16=64px |
| radius | sm=8px, md=12px, lg=16px, xl=24px, full=9999px |
| text | xs=12px, sm=14px, base=16px, lg=18px, xl=20px, 2xl=24px, 3xl=30px, 4xl=36px |
| weight | regular=400, medium=500, semibold=600, bold=700 |
| leading | tight=1.2, snug=1.35, normal=1.55, relaxed=1.7 |
