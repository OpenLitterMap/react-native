# Translations

## Architecture

Translation keys are **full British English string literals** where key = English display text. All translation files use a single flat JSON structure with keys sorted alphabetically A-Z.

### File Structure

Each language directory contains:
- `{lang}.json` - Flat key-value pairs (English key -> translated value)
- `litter.json` - Litter taxonomy (nested, kept separate for dynamic lookup)
- `index.js` - Combines both into a single export

```
assets/langs/
  en/  - English (source language)
  ar/  - Arabic
  de/  - German
  es/  - Spanish
  fr/  - French
  ie/  - Irish
  nl/  - Dutch
  pt/  - Portuguese
```

### How Keys Work

Keys are the English text itself:
```json
{
    "Email Address": "Adresse e-mail",
    "Password": "Mot de passe"
}
```

In code, use keys via `t()` or the `dictionary` prop:
```jsx
t('Email Address')
<Body dictionary="Email Address" />
```

Interpolation uses i18next `{{variable}}` syntax:
```json
{
    "You have uploaded {{count}} photos": "Vous avez téléversé {{count}} photo(s)"
}
```

### Litter Namespace

The `litter.json` file uses a **nested structure** derived from the backend `TagsConfig`. It is accessed via dot notation:
```js
t('litter.smoking.butts')       // -> "Cigarette Butts"
t('litter.categories.alcohol')  // -> "Alcohol"
t('litter.materials.plastic')   // -> "Plastic"
t('litter.types.beer')          // -> "Beer"
```

Unlike the flat `{lang}.json` files, `litter.json` is **translated per language** — each language directory has its own `litter.json` with identical keys but translated values.

#### Litter Sections

| Section | Description | Example key |
|---------|-------------|-------------|
| `categories` | 12 category display names | `litter.categories.smoking` |
| `alcohol` | Alcohol-related litter items (12) | `litter.alcohol.bottle` |
| `electronics` | Electronic waste items (6) | `litter.electronics.battery` |
| `food` | Food-related litter items (16) | `litter.food.crisp_packet` |
| `industrial` | Industrial waste items (14) | `litter.industrial.bricks` |
| `marine` | Marine/coastal litter items (9) | `litter.marine.fishing_net` |
| `materials` | Material types (28) | `litter.materials.plastic` |
| `medical` | Medical waste items (9) | `litter.medical.syringe` |
| `personal_care` | Personal care items (13) | `litter.personal_care.wipes` |
| `pets` | Pet-related waste (3) | `litter.pets.dog_waste` |
| `smoking` | Smoking-related litter (12) | `litter.smoking.butts` |
| `softdrinks` | Soft drink items (13) | `litter.softdrinks.straw` |
| `types` | Beverage/content types (17) | `litter.types.beer` |
| `unclassified` | Unclassified items (1) | `litter.unclassified.other` |
| `vehicles` | Vehicle-related litter (9) | `litter.vehicles.tyre` |

**Total: 174 key-value pairs per language.**

Keys are snake_case identifiers matching the backend `TagsConfig` (e.g. `cigarette_box`, `broken_glass`, `oil_drum`). These keys must stay in sync with the backend.

## Available Languages

| Code | Language   | File          |
|------|------------|---------------|
| en   | English    | en/en.json    |
| ar   | Arabic     | ar/ar.json    |
| de   | German     | de/de.json    |
| es   | Spanish    | es/es.json    |
| fr   | French     | fr/fr.json    |
| ie   | Irish      | ie/ie.json    |
| nl   | Dutch      | nl/nl.json    |
| pt   | Portuguese | pt/pt.json    |

## Adding a New Translation Key

When adding a new user-facing string:

1. Add the key to `assets/langs/en/en.json` with key = value (English text)
2. Add the translated value to ALL other language files (`ar.json`, `de.json`, `es.json`, `fr.json`, `ie.json`, `nl.json`, `pt.json`)
3. Keep all files sorted alphabetically A-Z by key
4. Use the key in code via `t('Your new string')` or `dictionary="Your new string"`

## Adding a New Litter Key

When the backend `TagsConfig` adds a new category, object, material, or type:

1. Add the key to `assets/langs/en/litter.json` in the appropriate section with the English display name
2. Add the translated value to ALL other `litter.json` files (`ar`, `de`, `es`, `fr`, `ie`, `nl`, `pt`)
3. Keep keys sorted alphabetically within each section

## Adding a New Language

1. Create a new directory: `assets/langs/{code}/`
2. Copy `en/en.json` and translate all values
3. Copy `en/litter.json` and translate all values (keys stay the same, values get translated)
4. Create `index.js` following the same pattern as other languages
5. Register the language in `i18n.js`
