# Little Sea design system — clear deep blue

Approved primary color: **#425FC4**. The production styles are centralized in `app/sea-design-system.css`, imported after the existing game CSS by both the web layout and native entry. `/design-system` is a review page using the same production tokens, semantic button classes, onboarding controls and actual `MobileDock` component.

## Foundations

| Token | Light | Dark / underwater |
| --- | --- | --- |
| Primary | #425FC4 | #8DA4FF |
| Primary hover | #354FAE | #A4B6FF |
| Primary pressed | #2D4399 | #7892F0 |
| Primary text | #FFFFFF | #14234B |
| Secondary surface | #EDF0FF | #283958 |
| Secondary text | #344884 | #DCE5FF |
| Panel surface | #FAFBFF | #192A43 |
| Text | #344765 | #EDF1FF |
| Muted text | #5C6B85 | #B6C3DC |
| Border | #D5DDF2 | #46597B |

Dark mode preserves a dark game surface and uses a lighter blue variant for readable controls. Primary text contrast: light 5.73:1, dark 6.48:1. Secondary text contrast: light 7.69:1, dark 9.19:1. Muted text on the light secondary surface is 4.75:1. These are color-pair calculations, not a claim of complete WCAG certification.

- Brand and display typography: locally bundled Maru Buri. UI labels keep the existing sans-serif stack.
- Single-line controls: minimum 44px height, 16px radius, 8px group gap. Multi-line destination/menu cards remain taller.
- Navigation: 64px capsule, five equal columns, 26px icon box with 22px artwork, 12px caption row, 4px icon/caption gap. Onboarding and actual dock share selected-tile styling.
- Focus: 3px visible outline, 3px offset. Hover applies only to hover-capable devices. Disabled controls do not depend on opacity alone.
- Semantic classes: `.sea-button--primary`, `--secondary`, `--ghost`; the legacy game selectors are mapped centrally to these same tokens to avoid changing action behavior.

## Coverage

Onboarding, beach/island docks, collection tabs and crown actions, exploration/map/amulet actions, wardrobe controls, weather tabs, cooking/fishing actions, boarding, tent actions, modal close buttons, idle recovery and native exit/retry controls. Character appearance color swatches and scene graphics retain their semantic colors.

Fishing still shows one control. Island swipe-menu visibility, boat stop/leave behavior, session security, ownership and reward logic are unchanged. A short landscape viewport shows the dock and hides decorative introduction text so controls remain reachable.

## Verification

Browser checks at 320×740, 390×844, 844×390 and 1180×850: onboarding and dock alignment, selected collection tabs, light/dark tokens, disabled/pressed states and keyboard focus. Review captures are under `/workspace/outputs/little-sea-design-system/`. Web/Toss builds and existing platform/security checks run in GitHub Actions. A physical Toss-device acceptance test and console submission remain separate steps.
