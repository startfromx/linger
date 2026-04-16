interface Props {
  formData: any
  setFormData: (data: any) => void
}

const PERSONALITY_TAGS = [
  'creative',
  'analytical',
  'empathetic',
  'witty',
  'adventurous',
  'thoughtful',
  'playful',
  'artistic',
  'sporty',
  'bookish',
  'spontaneous',
  'organized',
  'ambitious',
  'laid-back',
  'romantic',
  'independent',
]

export default function Step5({ formData, setFormData }: Props) {
  const toggleTag = (tag: string) => {
    const updated = formData.personality_tags.includes(tag)
      ? formData.personality_tags.filter((t: string) => t !== tag)
      : [...formData.personality_tags, tag]

    setFormData({
      ...formData,
      personality_tags: updated.slice(0, 5), // Max 5 tags
    })
  }

  return (
    <div className="bg-gray-900 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gold mb-2">Personality Tags</h2>
      <p className="text-gray-400 mb-6">Select up to 5 tags that describe you</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PERSONALITY_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`py-2 px-4 rounded transition capitalize ${
              formData.personality_tags.includes(tag)
                ? 'bg-gold text-dark-bg font-semibold'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <p className="text-gray-500 text-sm mt-6">
        Selected: {formData.personality_tags.length}/5
      </p>
    </div>
  )
}
