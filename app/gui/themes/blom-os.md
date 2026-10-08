# Blom-OS

Generated from the current project, including edits awaiting autosave. Return to the [theme index](../themes.md). Font names and weights are references only: license, download, and configure your own fonts.

## Foundations

```json
{
  "name": "Blom-OS",
  "text": {
    "l": {
      "size": 24,
      "lineHeight": 32,
      "letterSpacing": -0.02
    },
    "m": {
      "size": 16,
      "lineHeight": 24,
      "letterSpacing": -0.01
    },
    "s": {
      "size": 14,
      "lineHeight": 20,
      "letterSpacing": -0.005
    },
    "xl": {
      "size": 36,
      "lineHeight": 40,
      "letterSpacing": -0.025
    },
    "xs": {
      "size": 12,
      "lineHeight": 16,
      "letterSpacing": 0
    },
    "xxl": {
      "size": 48,
      "lineHeight": 52,
      "letterSpacing": -0.035
    },
    "xxs": {
      "size": 10,
      "lineHeight": 14,
      "letterSpacing": 0
    }
  },
  "fonts": {
    "ui": {
      "family": "Arial, Helvetica, sans-serif",
      "weights": {
        "heavy": 600,
        "medium": 500,
        "regular": 400
      }
    },
    "data": {
      "family": "Arial, Helvetica, sans-serif",
      "weights": {
        "heavy": 600,
        "medium": 500,
        "regular": 400
      }
    },
    "brand": {
      "family": "Arial, Helvetica, sans-serif",
      "weights": {
        "heavy": 600,
        "medium": 500,
        "regular": 400
      }
    },
    "editorial": {
      "family": "Arial, Helvetica, sans-serif",
      "weights": {
        "heavy": 600,
        "medium": 500,
        "regular": 400
      }
    }
  },
  "border": {
    "l": 2,
    "m": 1,
    "s": 1,
    "none": 0
  },
  "radius": {
    "l": 0,
    "m": 0,
    "s": 0,
    "xl": 0,
    "xs": 0,
    "full": 9999,
    "zero": 0
  },
  "shadows": {
    "l": {
      "x": 0,
      "y": 12,
      "blur": 36,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 0
    },
    "m": {
      "x": 0,
      "y": 4,
      "blur": 16,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 0
    },
    "s": {
      "x": 0,
      "y": 1,
      "blur": 3,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 0
    }
  },
  "spacing": {
    "l": 24,
    "m": 16,
    "s": 12,
    "xl": 32,
    "xs": 8,
    "xxl": 48,
    "xxs": 4,
    "zero": 0
  },
  "animation": {
    "large": {
      "easing": [
        0.22,
        1,
        0.36,
        1
      ],
      "duration": 300
    },
    "easing": [
      0.16,
      1,
      0.3,
      1
    ],
    "duration": 160,
    "popupScale": 0.98,
    "pressDistance": 1
  },
  "focusRing": {
    "color": "color-1",
    "width": "l",
    "opacity": 55
  },
  "iconStyle": "outlined",
  "iconFamily": "Lucide",
  "neutralTone": "neutral",
  "buttonRadius": "s",
  "colorEmphasis": 50,
  "surfaceDetails": {
    "dark": {
      "shade": 24,
      "highlight": 24,
      "gradientTop": 10,
      "recessedShade": 20,
      "gradientBottom": 12
    },
    "light": {
      "shade": 16,
      "highlight": 70,
      "gradientTop": 12,
      "recessedShade": 8,
      "gradientBottom": 5
    },
    "edgeColor": "neutral-6-transparent"
  },
  "primaryForeground": {
    "dark": "neutral-2",
    "light": "neutral-2"
  },
  "primaryActionColor": "neutral-10"
}
```

## light CSS variables

Define these in the app’s existing theme scope for this mode. Keep component styles linked to the variables.

| Variable | Value |
| --- | --- |
| `--theme-name` | Blom-OS |
| `--theme-icon-family` | Lucide |
| `--theme-icon-style` | outlined |
| `--toolbar-divider-bleed` | 0 |
| `--focus-ring-outline` | 2px solid color-mix(in srgb, #c51d17 55%, transparent) |
| `--icon-stroke-width` | 2 |
| `--icon-light-display` | none |
| `--icon-regular-display` | inline |
| `--icon-bold-display` | none |
| `--motion-duration` | 160ms |
| `--motion-easing` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--motion-type` | easing |
| `--motion-visual-duration` | 0.16 |
| `--motion-bounce` | 0.2 |
| `--motion-enabled` | 1 |
| `--motion-small-iterations` | infinite |
| `--motion-large-duration` | 300ms |
| `--motion-large-easing` | cubic-bezier(0.22, 1, 0.36, 1) |
| `--motion-large-type` | easing |
| `--motion-large-visual-duration` | 0.3 |
| `--motion-large-bounce` | 0.2 |
| `--motion-large-iterations` | infinite |
| `--motion-popup-scale` | 0.98 |
| `--motion-press-distance` | 1px |
| `--option-badge-background` | color-mix(in srgb, var(--color-1) 10%, transparent) |
| `--option-badge-foreground` | #c51d17 |
| `--navigation-active-foreground` | #111111 |
| `--emphasis-chart-fill` | #c51d1733 |
| `--emphasis-balance-background` | #f7f7f7 |
| `--emphasis-rewards-background` | #f7f7f7 |
| `--emphasis-icon-background` | #f7f7f7 |
| `--emphasis-icon-foreground` | #111111 |
| `--emphasis-type-background` | #f7f7f7 |
| `--emphasis-type-foreground` | #111111 |
| `--navigation-active-background` | #c51d1733 |
| `--surface-raised-image` | linear-gradient(180deg, #ffffff1f 0%, #ffffff00 48%, #1111110d 100%) |
| `--surface-raised-shadow` | inset 0px 1px 0px 0px #ffffffb3, inset 0px -1px 0px 0px #11111129 |
| `--surface-recessed-image` | linear-gradient(180deg, #1111110d 0%, #11111100 55%) |
| `--surface-recessed-shadow` | inset 0px 1px 2px 0px #11111114, inset 0px -1px 0px 0px #ffffff59 |
| `--space-zero` | 0px |
| `--space-xxs` | 4px |
| `--space-xs` | 8px |
| `--space-s` | 12px |
| `--space-m` | 16px |
| `--space-l` | 24px |
| `--space-xl` | 32px |
| `--space-xxl` | 48px |
| `--size-xxs` | 10px |
| `--line-xxs` | 14px |
| `--letter-spacing-xxs` | 0em |
| `--size-xs` | 12px |
| `--line-xs` | 16px |
| `--letter-spacing-xs` | 0em |
| `--size-s` | 14px |
| `--line-s` | 20px |
| `--letter-spacing-s` | -0.005em |
| `--size-m` | 16px |
| `--line-m` | 24px |
| `--letter-spacing-m` | -0.01em |
| `--size-l` | 24px |
| `--line-l` | 32px |
| `--letter-spacing-l` | -0.02em |
| `--size-xl` | 36px |
| `--line-xl` | 40px |
| `--letter-spacing-xl` | -0.025em |
| `--size-xxl` | 48px |
| `--line-xxl` | 52px |
| `--letter-spacing-xxl` | -0.035em |
| `--radius-zero` | 0px |
| `--radius-xs` | 0px |
| `--radius-s` | 0px |
| `--radius-m` | 0px |
| `--radius-l` | 0px |
| `--radius-xl` | 0px |
| `--radius-full` | 9999px |
| `--border-none` | 0px |
| `--border-s` | 1px |
| `--border-m` | 1px |
| `--border-l` | 2px |
| `--border-default-color` | #aaaaaa33 |
| `--border-shadow-none` | 0 0 0 0 transparent |
| `--border-shadow-s` | 0 0 0 1px #aaaaaa33 |
| `--border-shadow-m` | 0 0 0 1px #aaaaaa33 |
| `--border-shadow-l` | 0 0 0 2px #aaaaaa33 |
| `--font-ui` | Arial, Helvetica, sans-serif |
| `--weight-ui-regular` | 400 |
| `--weight-ui-medium` | 500 |
| `--weight-ui-heavy` | 600 |
| `--font-brand` | Arial, Helvetica, sans-serif |
| `--weight-brand-regular` | 400 |
| `--weight-brand-medium` | 500 |
| `--weight-brand-heavy` | 600 |
| `--font-editorial` | Arial, Helvetica, sans-serif |
| `--weight-editorial-regular` | 400 |
| `--weight-editorial-medium` | 500 |
| `--weight-editorial-heavy` | 600 |
| `--font-data` | Arial, Helvetica, sans-serif |
| `--weight-data-regular` | 400 |
| `--weight-data-medium` | 500 |
| `--weight-data-heavy` | 600 |
| `--color-none` | transparent |
| `--color-1` | #c51d17 |
| `--color-1-transparent` | #c51d1733 |
| `--color-2` | #f7f7f7 |
| `--color-2-transparent` | #f7f7f733 |
| `--color-3` | #d2d2d2 |
| `--color-3-transparent` | #d2d2d233 |
| `--color-4` | #111111 |
| `--color-4-transparent` | #11111133 |
| `--neutral-1` | #ffffff |
| `--neutral-1-transparent` | #ffffff33 |
| `--neutral-2` | #ffffff |
| `--neutral-2-transparent` | #ffffff33 |
| `--neutral-3` | #f7f7f7 |
| `--neutral-3-transparent` | #f7f7f733 |
| `--neutral-4` | #e5e5e5 |
| `--neutral-4-transparent` | #e5e5e533 |
| `--neutral-5` | #d2d2d2 |
| `--neutral-5-transparent` | #d2d2d233 |
| `--neutral-6` | #aaaaaa |
| `--neutral-6-transparent` | #aaaaaa33 |
| `--neutral-7` | #777777 |
| `--neutral-7-transparent` | #77777733 |
| `--neutral-8` | #595959 |
| `--neutral-8-transparent` | #59595933 |
| `--neutral-9` | #333333 |
| `--neutral-9-transparent` | #33333333 |
| `--neutral-10` | #111111 |
| `--neutral-10-transparent` | #11111133 |
| `--success` | #247348 |
| `--success-transparent` | #24734833 |
| `--warning` | #94651e |
| `--warning-transparent` | #94651e33 |
| `--error` | #bd3d42 |
| `--error-transparent` | #bd3d4233 |
| `--shadow-none` | none |
| `--shadow-s` | 0px 1px 3px 0px #11111100 |
| `--shadow-m` | 0px 4px 16px 0px #11111100 |
| `--shadow-l` | 0px 12px 36px 0px #11111100 |
| `--cte-canvas` | #ffffff |
| `--cte-surface` | #ffffff |
| `--cte-surface-muted` | #f7f7f7 |
| `--cte-text` | #111111 |
| `--cte-text-muted` | #777777 |
| `--cte-border` | #aaaaaa33 |
| `--cte-accent` | #c51d17 |
| `--cte-accent-text` | #ffffff |
| `--cte-danger` | #bd3d42 |
| `--cte-focus` | #c51d17 |
| `--cte-font` | Arial, Helvetica, sans-serif |
| `--cte-font-size` | 14px |
| `--cte-font-weight` | 400 |
| `--cte-line-height` | 20px |
| `--cte-letter-spacing` | -0.005em |
| `--cte-detail-font-size` | 12px |
| `--cte-detail-line-height` | 16px |
| `--cte-detail-letter-spacing` | 0em |

## dark CSS variables

Define these in the app’s existing theme scope for this mode. Keep component styles linked to the variables.

| Variable | Value |
| --- | --- |
| `--theme-name` | Blom-OS |
| `--theme-icon-family` | Lucide |
| `--theme-icon-style` | outlined |
| `--toolbar-divider-bleed` | 0 |
| `--focus-ring-outline` | 2px solid color-mix(in srgb, #d5adff 55%, transparent) |
| `--icon-stroke-width` | 2 |
| `--icon-light-display` | none |
| `--icon-regular-display` | inline |
| `--icon-bold-display` | none |
| `--motion-duration` | 160ms |
| `--motion-easing` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--motion-type` | easing |
| `--motion-visual-duration` | 0.16 |
| `--motion-bounce` | 0.2 |
| `--motion-enabled` | 1 |
| `--motion-small-iterations` | infinite |
| `--motion-large-duration` | 300ms |
| `--motion-large-easing` | cubic-bezier(0.22, 1, 0.36, 1) |
| `--motion-large-type` | easing |
| `--motion-large-visual-duration` | 0.3 |
| `--motion-large-bounce` | 0.2 |
| `--motion-large-iterations` | infinite |
| `--motion-popup-scale` | 0.98 |
| `--motion-press-distance` | 1px |
| `--option-badge-background` | color-mix(in srgb, var(--color-1) 10%, transparent) |
| `--option-badge-foreground` | #d5adff |
| `--navigation-active-foreground` | #fafafa |
| `--emphasis-chart-fill` | #d5adff33 |
| `--emphasis-balance-background` | #2a2a2e |
| `--emphasis-rewards-background` | #2a2a2e |
| `--emphasis-icon-background` | #2a2a2e |
| `--emphasis-icon-foreground` | #fafafa |
| `--emphasis-type-background` | #2a2a2e |
| `--emphasis-type-foreground` | #fafafa |
| `--navigation-active-background` | #d5adff33 |
| `--surface-raised-image` | linear-gradient(180deg, #fafafa1a 0%, #fafafa00 48%, #1717191f 100%) |
| `--surface-raised-shadow` | inset 0px 1px 0px 0px #fafafa3d, inset 0px -1px 0px 0px #1717193d |
| `--surface-recessed-image` | linear-gradient(180deg, #1717191f 0%, #17171900 55%) |
| `--surface-recessed-shadow` | inset 0px 1px 2px 0px #17171933, inset 0px -1px 0px 0px #fafafa1f |
| `--space-zero` | 0px |
| `--space-xxs` | 4px |
| `--space-xs` | 8px |
| `--space-s` | 12px |
| `--space-m` | 16px |
| `--space-l` | 24px |
| `--space-xl` | 32px |
| `--space-xxl` | 48px |
| `--size-xxs` | 10px |
| `--line-xxs` | 14px |
| `--letter-spacing-xxs` | 0em |
| `--size-xs` | 12px |
| `--line-xs` | 16px |
| `--letter-spacing-xs` | 0em |
| `--size-s` | 14px |
| `--line-s` | 20px |
| `--letter-spacing-s` | -0.005em |
| `--size-m` | 16px |
| `--line-m` | 24px |
| `--letter-spacing-m` | -0.01em |
| `--size-l` | 24px |
| `--line-l` | 32px |
| `--letter-spacing-l` | -0.02em |
| `--size-xl` | 36px |
| `--line-xl` | 40px |
| `--letter-spacing-xl` | -0.025em |
| `--size-xxl` | 48px |
| `--line-xxl` | 52px |
| `--letter-spacing-xxl` | -0.035em |
| `--radius-zero` | 0px |
| `--radius-xs` | 0px |
| `--radius-s` | 0px |
| `--radius-m` | 0px |
| `--radius-l` | 0px |
| `--radius-xl` | 0px |
| `--radius-full` | 9999px |
| `--border-none` | 0px |
| `--border-s` | 1px |
| `--border-m` | 1px |
| `--border-l` | 2px |
| `--border-default-color` | #80808a33 |
| `--border-shadow-none` | 0 0 0 0 transparent |
| `--border-shadow-s` | inset 0 0 0 1px #80808a33 |
| `--border-shadow-m` | inset 0 0 0 1px #80808a33 |
| `--border-shadow-l` | inset 0 0 0 2px #80808a33 |
| `--font-ui` | Arial, Helvetica, sans-serif |
| `--weight-ui-regular` | 400 |
| `--weight-ui-medium` | 500 |
| `--weight-ui-heavy` | 600 |
| `--font-brand` | Arial, Helvetica, sans-serif |
| `--weight-brand-regular` | 400 |
| `--weight-brand-medium` | 500 |
| `--weight-brand-heavy` | 600 |
| `--font-editorial` | Arial, Helvetica, sans-serif |
| `--weight-editorial-regular` | 400 |
| `--weight-editorial-medium` | 500 |
| `--weight-editorial-heavy` | 600 |
| `--font-data` | Arial, Helvetica, sans-serif |
| `--weight-data-regular` | 400 |
| `--weight-data-medium` | 500 |
| `--weight-data-heavy` | 600 |
| `--color-none` | transparent |
| `--color-1` | #d5adff |
| `--color-1-transparent` | #d5adff33 |
| `--color-2` | #9974b8 |
| `--color-2-transparent` | #9974b833 |
| `--color-3` | #94b8a4 |
| `--color-3-transparent` | #94b8a433 |
| `--color-4` | #c6a492 |
| `--color-4-transparent` | #c6a49233 |
| `--neutral-1` | #171719 |
| `--neutral-1-transparent` | #17171933 |
| `--neutral-2` | #202023 |
| `--neutral-2-transparent` | #20202333 |
| `--neutral-3` | #2a2a2e |
| `--neutral-3-transparent` | #2a2a2e33 |
| `--neutral-4` | #3b3b40 |
| `--neutral-4-transparent` | #3b3b4033 |
| `--neutral-5` | #55555d |
| `--neutral-5-transparent` | #55555d33 |
| `--neutral-6` | #80808a |
| `--neutral-6-transparent` | #80808a33 |
| `--neutral-7` | #ababB4 |
| `--neutral-7-transparent` | #ababB433 |
| `--neutral-8` | #cdCDD3 |
| `--neutral-8-transparent` | #cdCDD333 |
| `--neutral-9` | #e8e8ed |
| `--neutral-9-transparent` | #e8e8ed33 |
| `--neutral-10` | #fafafa |
| `--neutral-10-transparent` | #fafafa33 |
| `--success` | #8fd5ad |
| `--success-transparent` | #8fd5ad33 |
| `--warning` | #e5c279 |
| `--warning-transparent` | #e5c27933 |
| `--error` | #f49fa5 |
| `--error-transparent` | #f49fa533 |
| `--shadow-none` | none |
| `--shadow-s` | 0px 1px 3px 0px #17171900 |
| `--shadow-m` | 0px 4px 16px 0px #17171900 |
| `--shadow-l` | 0px 12px 36px 0px #17171900 |
| `--cte-canvas` | #171719 |
| `--cte-surface` | #202023 |
| `--cte-surface-muted` | #2a2a2e |
| `--cte-text` | #fafafa |
| `--cte-text-muted` | #ababB4 |
| `--cte-border` | #80808a33 |
| `--cte-accent` | #d5adff |
| `--cte-accent-text` | #202023 |
| `--cte-danger` | #f49fa5 |
| `--cte-focus` | #d5adff |
| `--cte-font` | Arial, Helvetica, sans-serif |
| `--cte-font-size` | 14px |
| `--cte-font-weight` | 400 |
| `--cte-line-height` | 20px |
| `--cte-letter-spacing` | -0.005em |
| `--cte-detail-font-size` | 12px |
| `--cte-detail-line-height` | 16px |
| `--cte-detail-letter-spacing` | 0em |

## Authored component assignments

These are project edits. The [component reference](blom-os-components.md) includes the effective assignments with defaults and shared parts resolved.

```json
{
  "componentTokens": {
    "button:outline:rest": {
      "borderColor": "neutral-6-transparent"
    },
    "button:primary:rest": {
      "shadow": "s",
      "borderColor": "neutral-6-transparent"
    },
    "button:primary:focus": {
      "shadow": "s",
      "borderColor": "neutral-7-transparent"
    },
    "button:primary:hover": {
      "shadow": "s",
      "borderColor": "neutral-7-transparent"
    },
    "button:secondary:rest": {
      "shadow": "s",
      "background": "neutral-1",
      "borderColor": "neutral-6-transparent"
    },
    "button:secondary:focus": {
      "shadow": "s",
      "background": "neutral-2",
      "borderColor": "neutral-7-transparent"
    },
    "button:secondary:hover": {
      "shadow": "s",
      "background": "neutral-2",
      "borderColor": "neutral-7-transparent"
    }
  },
  "componentVariants": {}
}
```
