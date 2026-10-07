# Vercel Dev Environment Variable Loading Issue - Diagnosis

## Problem
When running `npx vercel dev`, the API logs:
```
Wallet balance error: GoldRush API key not configured
```

This means `process.env.GOLDRUSH_API_KEY` is `undefined` in the serverless function.

## Current State

| Item | Status | Details |
|------|--------|---------|
| `.env.local` exists | ✅ YES | File present at project root |
| `.env.local` format | ✅ CORRECT | `GOLDRUSH_API_KEY=<value>` |
| `.gitignore` protection | ✅ YES | `.env.local` protected from git |
| `vercel.json` | ❌ NO | Not present |
| `package.json` | ❌ NO | **NOT PRESENT** |
| `.vercel/` project config | ✅ YES | Project is linked to Vercel |

## Root Cause

**Vercel Dev requires `package.json` to recognize Node.js backend code.**

Without `package.json`:
1. Vercel CLI treats the project as a **pure static site** only
2. The `/api` functions are NOT recognized as Node.js serverless functions
3. `.env.local` is NOT loaded into the serverless function environment
4. The Node.js runtime doesn't initialize properly for `/api`

Result: `process.env.GOLDRUSH_API_KEY` is undefined because the environment isn't being passed.

## How Vercel Dev Works

### WITH package.json (correct):
```
vercel dev
  ↓
Detects package.json → "This is a Node.js project"
  ↓
Loads .env.local → Reads GOLDRUSH_API_KEY
  ↓
Starts /api functions → process.env.GOLDRUSH_API_KEY available
```

### WITHOUT package.json (current):
```
vercel dev
  ↓
Sees static HTML/CSS/JS only → "Pure static site"
  ↓
.env.local is ignored → Not loaded
  ↓
/api functions start without env → process.env.GOLDRUSH_API_KEY undefined
```

## Solution (Smallest & Safest)

Create a **minimal `package.json`** at the project root:

```json
{
  "name": "chogware",
  "version": "1.0.0",
  "description": "Windows 98-style web OS with blockchain wallet inspector",
  "private": true
}
```

**Why this works:**
- Tells Vercel: "This project has Node.js code"
- Enables Vercel Dev to load `.env.local`
- No dependencies needed (no npm install required)
- Compatible with current /api serverless functions
- Preserves existing architecture (no refactoring)
- Minimal and surgical change

## Testing the Fix

After creating `package.json`:

```bash
npx vercel dev
```

Expected behavior:
1. Vercel Dev recognizes project structure
2. `.env.local` loads into `/api` environment
3. `process.env.GOLDRUSH_API_KEY` is defined
4. API responds with balance instead of "not configured"

## Alternative (Not Recommended)

Create `vercel.json` with environment configuration:
```json
{
  "env": {
    "GOLDRUSH_API_KEY": "@goldrush_api_key"
  }
}
```

**Problems with this approach:**
- Requires manual setup in Vercel CLI
- More complex than package.json
- Doesn't solve the root cause (missing package.json)
- May not load `.env.local` properly

## Recommendation

**Create minimal `package.json` — this is the standard, safest fix.**

No other changes needed:
- Keep `goldrush.js` as-is
- Keep `balance.js` as-is
- Keep CHOGWARE architecture unchanged
- `.env.local` will automatically load
