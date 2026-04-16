# Admin System Setup Guide

## Overview

The admin system allows you to create and manage fictional demo characters for beta testing without needing real creator sign-ups.

## Setting Up Admin Access

### 1. Configure Admin Emails

Edit `.env.local` and add your admin email:

```env
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com,admin@linger.ai
```

For multiple admins, separate with commas:
```env
NEXT_PUBLIC_ADMIN_EMAILS=you@example.com,partner@example.com,admin@linger.ai
```

### 2. Restart Your Dev Server

```bash
npm run dev
```

### 3. Sign In with Admin Account

- Sign in to the app with one of your admin emails
- You'll now have access to the admin panel

## Admin Features

### Creating Characters

1. **Navigate to Admin Panel**: `/admin/characters`
2. **Click "Create Character"**
3. **Fill in Details**:
   - Display name (e.g., "Asian Office Lady", "Gym Master")
   - Age, gender, profession
   - Interests, description, photos
4. **Add Transcript**:
   - Choose transcript type (WhatsApp, YouTube, Podcast, or generic text)
   - Paste the transcript content
   - Click "Extract Personality"
5. **Review Preview**:
   - See the personality fingerprint extracted from the transcript
   - Check confidence scores
6. **Create Character**:
   - Click "Create Character"
   - Character is instantly available in the app

### Adding More Transcripts

Once a character is created, you can add more transcripts to refine their personality:

1. **Go to character edit page**
2. **Click "Add Transcript"**
3. **Upload another transcript** (can be different format)
4. **System automatically merges** with existing personality
5. **Confidence scores improve** with more sources

## Demo Character Creation Script

Create multiple demo characters at once:

```bash
npx ts-node scripts/create-demo-characters.ts
```

This will create 5 sample characters with realistic transcripts:
- Asian Office Lady (28)
- Gym Master (29)
- Creative Designer (26)
- Startup Founder (32)
- Travel Blogger (24)

### Using Custom Transcripts

Edit `scripts/create-demo-characters.ts` to modify demo characters or add your own:

```typescript
const demoCharacters: DemoCharacter[] = [
  {
    displayName: "Your Character Name",
    age: 30,
    gender: "female",
    profession: ["Designer", "Artist"],
    interests: ["Art", "Design"],
    description: "Your description",
    sourceType: "generic",
    transcript: `Your transcript text here...`
  },
  // Add more...
]
```

## Accessing Characters

### For Admins
- Management: `/admin/characters`
- Create new: `/admin/characters/create`
- Edit existing: `/admin/characters/[characterId]`

### For Users
- Discover characters: `/discover`
- Chat with character: `/chat/[characterId]`
- Character shows up like a real creator

## Transcript Formats

### WhatsApp Format
```
[HH:MM, DD/MM/YYYY] Name: Message
[10:32 AM, 3/15/2025] Alex: Hey! How's it going?
[10:33 AM, 3/15/2025] Alex: Just finished a project
```

### YouTube/Podcast Format
```
[Speaker Name]: Message
Alex: Welcome to the podcast
Host: Thanks for being here
```

Or:

```
Speaker Name: Message
Alex: Today we're talking about...
```

### Generic Text Format
Just paste regular text, paragraphs will be automatically extracted.

## Personality Fingerprint Explained

Each character gets a personality profile extracted from transcripts:

- **Writing Style**: conversational, detailed, concise, expressive
- **Emotional Tone**: warm, introspective, playful, passionate, balanced
- **Humor Style**: witty, subtle, dry
- **Vocabulary Level**: casual, sophisticated, casual/informal
- **Conversational Patterns**: engaging, expressive, open
- **Interests**: Frequency-based (e.g., travel: 15%, fitness: 8%)
- **Values**: derived from interests and tone (e.g., "creative", "health-conscious")
- **Example Messages**: Top 20 messages from transcript used for learning

### Confidence Scores

- **0-30%**: Low confidence - add more transcript
- **30-70%**: Medium confidence - personality roughly captured
- **70-100%**: High confidence - accurate personality profile

Adding multiple transcripts significantly improves confidence!

## Database Schema

Admin system uses these tables:

- **creator_profile**: Main character data
  - `is_fictional`: Marked as true for demo characters
  - `voice_fingerprint`: Extracted personality
  - `source_count`: Number of transcripts merged

- **creator_sources**: Individual transcript sources
  - `source_type`: whatsapp, youtube, podcast, generic
  - `uploaded_text`: Raw transcript
  - `fingerprint`: Extracted from this source
  - `confidence`: 0-1 confidence score

## API Endpoints

### Create Character
```
POST /api/admin/characters
Content-Type: application/json

{
  "display_name": "Character Name",
  "age": 28,
  "gender": "female",
  "profession": ["Designer"],
  "interests": ["Art"],
  "character_description": "...",
  "voice_fingerprint": { ... },
  "profile_photo_url": "https://...",
  "gallery_urls": [],
  "personality_tags": []
}
```

### Merge Transcript
```
PATCH /api/admin/characters
Content-Type: application/json

{
  "character_id": "uuid",
  "transcript_text": "...",
  "source_type": "whatsapp|youtube|podcast|generic",
  "speaker_name": "optional"
}
```

## Troubleshooting

### Admin Access Denied
- Check that your email is in `NEXT_PUBLIC_ADMIN_EMAILS` in `.env.local`
- Make sure it's the exact same email you signed up with
- Restart dev server after changing .env

### Character Creation Failed
- Check browser console for error message
- Ensure transcript has at least a few lines of text
- Try a different transcript format

### Personality Looks Wrong
- Add more transcript text (at least 500+ words recommended)
- Try multiple transcripts in different formats
- Confidence score should improve with more data

### Characters Not Showing in Discover
- Characters are created with `is_fictional: true`
- Check that `is_fictional` is false in your WHERE clause if filtering
- Try refreshing `/discover` page

## Next Steps

1. **Create 5-10 demo characters** for your beta launch
2. **Test the chat experience** - make sure personality comes through
3. **Gather feedback** on authenticity
4. **Refine transcripts** based on what works best
5. **Eventually transition** to real creators when they sign up

---

For questions or issues, check the admin routes and API endpoints in the codebase.
