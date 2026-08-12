import { useState } from 'react'
import { Tag } from '../atoms/Tag'
import { HorizontalScroller } from '../atoms/HorizontalScroller'

interface TagEditorProps {
  initialTags?: string[]
  onChange?: (tags: string[]) => void
}

export function TagEditor({ initialTags = [], onChange }: TagEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags)

  function removeTag(tagToRemove: string) {
    const updated = tags.filter((tag) => tag !== tagToRemove)
    setTags(updated)
    onChange?.(updated)
  }

  return (
    <div className="bg-border rounded-2xl p-3">
      <HorizontalScroller>
        {tags.map((tag) => (
          <Tag key={tag} label={tag} onRemove={() => removeTag(tag)} />
        ))}
      </HorizontalScroller>
    </div>
  )
}