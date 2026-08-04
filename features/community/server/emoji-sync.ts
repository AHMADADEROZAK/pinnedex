import "server-only"

import { connectToDatabase } from "@/lib/mongodb"
import { Emoji } from "@/features/community/models/Emoji"

const API_KEY = "89e3003912e161df16d4c61a349584ca5a189648"
const API_URL = `https://emoji-api.com/emojis?access_key=${API_KEY}`

interface ApiEmoji {
  slug: string
  character: string
  unicodeName: string
  codePoint: string
  group: string
  subGroup: string
}

export async function syncEmojis() {
  await connectToDatabase()

  const count = await Emoji.countDocuments()
  if (count > 0) return

  const res = await fetch(API_URL)
  if (!res.ok) {
    console.error("Failed to fetch emojis:", res.status)
    return
  }

  const data = (await res.json()) as ApiEmoji[]

  const docs = data.map((e) => ({
    character: JSON.parse(`"${e.character}"`),
    group: e.group,
    subGroup: e.subGroup,
    unicodeName: e.unicodeName,
    slug: e.slug,
  }))

  await Emoji.insertMany(docs, { ordered: false }).catch(() => {})
}
