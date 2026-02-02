CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND split_part(name, '/', 2) ~~ (auth.uid()::text || '-%'));
