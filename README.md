# Closet AI

Photograph every item in your closet; Claude tags it against a detailed
clothing taxonomy (sleeve/length, season, fabric, weight, fit, formality,
pattern, texture, construction, occasion, color treatment). Ask for outfit
ideas built only from what you actually own, and preview them layered onto
an avatar photo of yourself before you get dressed.

## Architecture

```
backend/   Node.js + Express + TypeScript + Prisma/PostgreSQL API.
           Calls the Claude API (vision) to classify garment photos and
           to compose outfit recommendations from the closet inventory.
mobile/    Expo (React Native + TypeScript) app. Camera capture, closet
           browsing, avatar setup, outfit requests, and a try-on preview
           screen.
```

Multi-user: accounts are email/password with JWT auth; each user's closet,
avatar, and outfits are scoped to their own account in Postgres.

## How the AI features work

- **Garment classification** (`backend/src/services/claude.ts`,
  `classifyGarmentImage`): the photo is sent to Claude with a forced
  tool-use call (`classify_garment`) whose input schema enumerates every
  taxonomy dimension as an enum array, plus `garmentType` (top / bottom /
  dress / outerwear / footwear / accessory) and `dominantColors`.
  `garmentType` and `dominantColors` aren't part of the taxonomy you
  specified, but they're required to build coherent outfits and to know
  where to place each item on the avatar — they're inferred automatically,
  not asked of the user.
- **Outfit recommendations** (`recommendOutfits`): the user's full closet
  (as JSON, tags included) plus occasion/weather/style context is sent to
  Claude, which returns 1-3 outfits referencing real closet item IDs via a
  `recommend_outfits` tool call. Item IDs that don't exist in the closet
  are filtered out server-side before returning to the client.
- **Avatar try-on**: the user takes one full-body selfie. Claude estimates
  rough normalized bounding boxes for torso/legs/feet
  (`estimateAvatarAnchors`) via another tool call, falling back to fixed
  centered defaults if that fails. The mobile app then layers the
  recommended items' photos on top of the avatar photo at those regions.
  **This is an approximate compositing preview, not photorealistic
  virtual try-on** — item photos aren't background-removed or warped to
  body shape. See "Known limitations" below for how to upgrade this later.

## Running it locally

### 1. Backend

```
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
npm install
npx prisma migrate dev --name init   # creates tables in your Postgres DB
npm run dev                          # http://localhost:4000
```

You need a running Postgres instance (`DATABASE_URL`) and an Anthropic API
key (`ANTHROPIC_API_KEY`) with vision-capable model access.

### 2. Mobile app

```
cd mobile
cp .env.example .env   # set EXPO_PUBLIC_API_URL to your machine's LAN IP, e.g. http://192.168.1.42:4000
npm install
npm run start           # opens Expo dev tools; scan the QR code with Expo Go
```

Use your machine's LAN IP, not `localhost` — the Expo Go app runs on a
separate device/simulator and can't resolve your laptop's `localhost`.

## Taxonomy

The full classification taxonomy lives in one place per app —
`backend/src/services/taxonomy.ts` and `mobile/src/taxonomy.ts` (kept in
sync manually; they're small and rarely change). It mirrors exactly what
was requested:

- Sleeve/length, season/weather, fabric/material, weight/thickness, fit,
  formality, pattern, texture, construction/style, occasion, color
  treatment — each stored as a string array per item, since a garment can
  legitimately carry more than one value in a dimension (e.g. a
  cotton/spandex blend, or something that's both "ribbed" and "knit").

## Known limitations / natural next steps

- **Try-on is a layered-photo approximation**, not a photorealistic
  render. Upgrading to true virtual try-on (body-shape-aware warping, or
  an image-generation model rendering the person actually wearing the
  outfit) was explicitly scoped out for speed/cost/reliability — the
  mobile `TryOnScreen` and backend `Avatar` model are structured so that
  swapping in a smarter renderer later doesn't require a data model
  change.
- Garment photos aren't background-removed before being layered onto the
  avatar; results look best with plain-background, flat-lay or hanger
  photos.
- Avatar body-region anchors are AI-estimated, not measured — precision
  will vary by photo.
- Local disk is used for uploaded images (`backend/uploads/`); swap in S3
  or equivalent object storage before deploying anywhere persistent.
