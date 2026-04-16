interface Props {
  formData: any
  setFormData: (data: any) => void
}

export default function Step1({ formData, setFormData }: Props) {
  return (
    <div className="bg-gray-900 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gold mb-2">Basic Info</h2>
      <p className="text-gray-400 mb-6">Let's start with the essentials</p>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm mb-2">Display Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={formData.display_name}
            onChange={(e) =>
              setFormData({ ...formData, display_name: e.target.value })
            }
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Age</label>
            <input
              type="number"
              placeholder="25"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">City</label>
            <input
              type="text"
              placeholder="Los Angeles"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2">Bio</label>
          <textarea
            placeholder="Tell visitors about yourself in one line..."
            value={formData.bio}
            onChange={(e) =>
              setFormData({ ...formData, bio: e.target.value })
            }
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 h-20 resize-none"
          />
          <p className="text-gray-500 text-xs mt-1">{formData.bio.length}/100</p>
        </div>
      </div>
    </div>
  )
}
