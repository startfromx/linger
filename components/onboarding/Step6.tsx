import { useState } from 'react'

interface Props {
  formData: any
  setFormData: (data: any) => void
}

const TOPIC_SUGGESTIONS = [
  'politics',
  'religion',
  'exes',
  'financial details',
  'work stress',
  'family drama',
  'health concerns',
  'sad topics',
  'heavy discussions',
  'illegal activities',
]

export default function Step6({ formData, setFormData }: Props) {
  const [customTopic, setCustomTopic] = useState('')

  const toggleTopic = (topic: string) => {
    const updated = formData.topics_off_limits.includes(topic)
      ? formData.topics_off_limits.filter((t: string) => t !== topic)
      : [...formData.topics_off_limits, topic]

    setFormData({
      ...formData,
      topics_off_limits: updated,
    })
  }

  const addCustomTopic = () => {
    if (customTopic.trim()) {
      setFormData({
        ...formData,
        topics_off_limits: [...formData.topics_off_limits, customTopic.trim()],
      })
      setCustomTopic('')
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gold mb-2">Off-Limits Topics</h2>
      <p className="text-gray-400 mb-6">What subjects are off-limits? (optional)</p>

      <div className="space-y-6">
        <div>
          <p className="text-gray-300 text-sm mb-3">Common topics:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TOPIC_SUGGESTIONS.map((topic) => (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`py-2 px-4 rounded transition capitalize text-sm ${
                  formData.topics_off_limits.includes(topic)
                    ? 'bg-red-900 bg-opacity-50 text-red-300 border border-red-700'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-gray-300 text-sm mb-3">Add your own:</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type and press add..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500"
            />
            <button
              onClick={addCustomTopic}
              className="bg-gold text-dark-bg px-6 rounded font-semibold hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>

        {formData.topics_off_limits.length > 0 && (
          <div>
            <p className="text-gray-300 text-sm mb-2">Your topics:</p>
            <div className="flex flex-wrap gap-2">
              {formData.topics_off_limits.map((topic: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-red-900 bg-opacity-30 text-red-300 px-3 py-1 rounded text-sm flex items-center gap-2"
                >
                  {topic}
                  <button
                    onClick={() => toggleTopic(topic)}
                    className="hover:opacity-70"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-800 bg-opacity-50 border border-gray-700 rounded p-4">
        <p className="text-gray-400 text-sm">
          ✓ Your AI twin will respect these boundaries and politely decline conversations about these topics.
        </p>
      </div>
    </div>
  )
}
