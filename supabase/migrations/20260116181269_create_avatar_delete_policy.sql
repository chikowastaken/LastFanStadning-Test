CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND split_part(name, '/', 2) ~~ (auth.uid()::text || '-%'));
