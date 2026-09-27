-- Allow browser MediaRecorder voice notes (audio/webm) in chat-media bucket.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/png',
  'image/jpeg',
  'image/webp',
  'audio/mpeg',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'application/pdf'
]
WHERE id = 'chat-media';
