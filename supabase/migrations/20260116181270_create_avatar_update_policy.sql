CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND split_part(name, '/', 2) ~~ (auth.uid()::text || '-%'))
WITH CHECK (bucket_id = 'avatars' AND split_part(name, '/', 2) ~~ (auth.uid()::text || '-%'));
