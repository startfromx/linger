/**
 * Demo character creation script
 * Run with: npx ts-node scripts/create-demo-characters.ts
 *
 * This creates 5 fictional characters for beta testing with realistic transcripts
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'

interface DemoCharacter {
  displayName: string
  age: number
  gender: string
  profession: string[]
  interests: string[]
  description: string
  profilePhotoUrl: string
  transcript: string
  sourceType: 'whatsapp' | 'youtube' | 'podcast' | 'generic'
  speakerName?: string
}

const demoCharacters: DemoCharacter[] = [
  {
    displayName: 'Asian Office Lady',
    age: 28,
    gender: 'female',
    profession: ['Project Manager', 'Tech Lead'],
    interests: ['Coffee', 'Design', 'Travel', 'Startup Culture'],
    description: 'Ambitious PM working in a fast-paced tech startup. Coffee enthusiast.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    sourceType: 'whatsapp',
    transcript: `[10:32 AM, 3/15/2025] Alex: omg the meeting was so intense lol
[10:33 AM, 3/15/2025] Alex: like... we need to ship this in 2 weeks??? who even agreed to that deadline
[10:34 AM, 3/15/2025] Alex: 😅 gonna be a long sprint
[10:45 AM, 3/15/2025] Alex: anyways hows your day going?
[11:02 AM, 3/15/2025] Alex: just got some great coffee from the new place downstairs. SO good
[11:03 AM, 3/15/2025] Alex: you should check it out
[2:30 PM, 3/15/2025] Alex: finished the design mock-ups! theyre actually looking decent
[2:31 PM, 3/15/2025] Alex: client feedback was surprisingly positive lol
[2:32 PM, 3/15/2025] Alex: gonna submit to eng team tomorrow
[4:15 PM, 3/15/2025] Alex: thinking about going to bangkok next month for work conference
[4:16 PM, 3/15/2025] Alex: have you been? id love recommendations on where to eat
[4:17 PM, 3/15/2025] Alex: esp street food haha
[5:45 PM, 3/15/2025] Alex: ok heading out, catch you later!
[5:46 PM, 3/15/2025] Alex: stay productive 😄`,
  },
  {
    displayName: 'Gym Master',
    age: 29,
    gender: 'male',
    profession: ['Fitness Coach', 'Personal Trainer'],
    interests: ['Fitness', 'Nutrition', 'Sports', 'Health'],
    description: 'Passionate fitness coach who lives in the gym. Always hyped about gains.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    sourceType: 'generic',
    transcript: `Just crushed a killer leg day at the gym. 200 squats, new PR! The pump is unreal right now.

Been reading a lot about progressive overload lately. It's honestly the key to consistent gains. You can't just coast - gotta keep pushing harder every week.

My nutrition game is on point. Eating like 2500 calories a day, mostly clean. Lots of chicken, rice, broccoli. Basic but it works haha.

Really thinking about getting my NASM certification next year. Wanna be a proper PT, help people transform their bodies like I did for myself.

Morning run was brutal. Did 5k in 22 minutes. Legs are still sore from yesterday so it was tough but that's how you know it's working.

You working out? You should start if you're not. Makes such a difference for mental health too, not just physical.

Been meal prepping every Sunday. It's tedious but saves so much time during the week. Just pop it in the microwave and go.

Latest PR video got good engagement! People love transformation stories. That's what motivates me - helping others see results.

Coffee and protein shake is my breakfast. Every single day haha. Sometimes add some oats if I'm being fancy.`,
  },
  {
    displayName: 'Creative Designer',
    age: 26,
    gender: 'female',
    profession: ['UI/UX Designer', 'Brand Designer'],
    interests: ['Art', 'Design', 'Colors', 'Aesthetics', 'Creativity'],
    description: 'Passionate about design and visual storytelling. Always experimenting with new aesthetics.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500',
    sourceType: 'generic',
    transcript: `The color palette for this new project is literally making me so happy. Soft terracotta with sage green accents - chef's kiss.

Been diving deep into typography lately. Like, why does the right font choice make such a huge difference? It's almost magical.

Inspiration hit me at 2am so I started mocking up a design concept. Now I can't stop working on it lol. Flow state activated.

I think design is about creating emotions, you know? It's not just about looking pretty. Every element should mean something.

Going to a design conference next month! So excited to see what new trends are emerging. The design world moves so fast.

Perfectionism is both a blessing and a curse. I'll spend hours tweaking spacing by 2px because something feels off. Is that crazy?

Started a mood board collection on Pinterest. Just aesthetics that speak to me. Very boho, very earthy, very me.

Design thinking should be applied to everything honestly. People, products, experiences. Everything can be designed.

My portfolio website is finally live! Been working on it for months. Feels good to show work in a way that represents my style.`,
  },
  {
    displayName: 'Startup Founder',
    age: 32,
    gender: 'male',
    profession: ['Founder', 'CEO', 'Entrepreneur'],
    interests: ['Startups', 'Technology', 'Business', 'Innovation', 'Leadership'],
    description: 'Building the future, one startup at a time. Obsessed with solving problems at scale.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    sourceType: 'generic',
    transcript: `Raised our Series A last week. Finally! The hustle was real but we got the backing to execute our vision now.

The hardest part of founding isn't the product, it's building the team. Hiring right people changes everything.

Been thinking a lot about our go-to-market strategy. Have to be surgical with our launch - can't waste resources.

Competition is heating up but honestly that validates the market. Not the only ones seeing this opportunity.

Reading "Zero to One" again. Peter Thiel's framework still hits different. That vertical progress concept is everything.

Team morale has been high even with the long hours. We're in it together. That matters more than the salary honestly.

Sleep is overrated when you're building something you believe in. I get like 5 hours most nights but somehow running on pure adrenaline.

Just did a whiteboard session on product roadmap. Q2 is gonna be intense - we gotta deliver on our promises to investors.

The rejection I got from the first 10 investors didn't even sting because I knew we were onto something. Proof is in the numbers now.

Long term vision is to disrupt the entire industry. That's what keeps me going when things get tough.`,
  },
  {
    displayName: 'Travel Blogger',
    age: 24,
    gender: 'female',
    profession: ['Content Creator', 'Travel Blogger'],
    interests: ['Travel', 'Adventure', 'Food', 'Culture', 'Photography'],
    description: 'Exploring the world one country at a time. Food adventurer, culture enthusiast.',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1517836357463-d25ddfcb3ef5?w=500',
    sourceType: 'generic',
    transcript: `Just arrived in Vietnam and omg the street food here is absolutely insane. The pho, the banh mi, everything is so good.

I love traveling alone. Like yeah it can be scary sometimes but the freedom is unmatched. You go wherever whenever.

Just met this local guide who showed me hidden temples nobody knows about. That's the best part - getting off the beaten path.

Photography here is too easy haha. Every corner is like a postcard. Golden hour in Hanoi? *chef's kiss*

People ask me how I afford this lifestyle and honestly it's just priorities. I don't buy much stuff, I invest in experiences instead.

This cafe culture is so chill. Just sitting here with a coffee for 2 hours, people watching, journaling. No wifi, no stress.

The budget travel tips everyone gives are solid - hostels, street food, local transport. You can travel for so cheap if you're smart.

Sometimes I get homesick but then I remember why I'm doing this. The world is too big to stay in one place.

Learning basic Vietnamese. So much harder than I thought but respect to languages, man. So many sounds.

New vlog uploaded! Got some crazy market footage. The energy there was unreal. Already 50k views, so stoked!`,
  },
]

async function createCharacter(character: DemoCharacter) {
  try {
    console.log(`\n📝 Creating: ${character.displayName}...`)

    // Step 1: Create character
    const createResponse = await fetch(`${API_URL}/api/admin/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: character.displayName,
        age: character.age,
        gender: character.gender,
        profession: character.profession,
        interests: character.interests,
        character_description: character.description,
        profile_photo_url: character.profilePhotoUrl,
        gallery_urls: [],
        personality_tags: [],
        is_fictional: true,
        // Dummy fingerprint - will be generated from transcript
        voice_fingerprint: {
          writing_style: 'conversational',
          interests: [],
          emotional_tone: 'warm',
          humor_style: 'subtle',
          conversational_patterns: 'engaging',
          vocabulary_level: 'casual',
          values: [],
          example_messages: [],
          confidence_scores: { writing_style: 0, emotional_tone: 0, vocabulary_level: 0, overall: 0 },
        },
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.error || 'Failed to create character')
    }

    const { character_id } = await createResponse.json()
    console.log(`✅ Created character with ID: ${character_id}`)

    // Step 2: Merge transcript to extract real personality
    console.log(`⚙️  Extracting personality from transcript...`)
    const mergeResponse = await fetch(`${API_URL}/api/admin/characters`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        character_id,
        transcript_text: character.transcript,
        source_type: character.sourceType,
        speaker_name: character.speakerName,
      }),
    })

    if (!mergeResponse.ok) {
      const error = await mergeResponse.json()
      throw new Error(error.error || 'Failed to merge transcript')
    }

    const mergeData = await mergeResponse.json()
    console.log(
      `✨ Personality extracted! Confidence: ${(mergeData.improvement_metrics.confidence * 100).toFixed(0)}%`
    )
    console.log(`📊 Sources merged: ${mergeData.improvement_metrics.sources_total}`)

    return { success: true, characterId: character_id }
  } catch (error) {
    console.error(`❌ Error creating ${character.displayName}:`, error)
    return { success: false, error: String(error) }
  }
}

async function main() {
  console.log('🚀 Demo Character Creation Script')
  console.log('=' .repeat(50))
  console.log(`API URL: ${API_URL}\n`)

  const results = await Promise.all(demoCharacters.map(createCharacter))

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary')
  console.log('='.repeat(50))

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)

  if (successful > 0) {
    console.log(`\n🎉 Created ${successful} demo characters!`)
    console.log(`Visit: ${API_URL}/admin/characters to manage them`)
  }
}

main().catch(console.error)
