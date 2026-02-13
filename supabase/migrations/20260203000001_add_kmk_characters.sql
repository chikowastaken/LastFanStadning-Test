-- ============================================================
-- KMK Characters: Table + Data (run this on production)
-- ============================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.kmk_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.kmk_characters ENABLE ROW LEVEL SECURITY;

-- 3. Policies (drop first to avoid conflicts if re-running)
DROP POLICY IF EXISTS "Authenticated users can view KMK characters" ON public.kmk_characters;
CREATE POLICY "Authenticated users can view KMK characters"
  ON public.kmk_characters
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage KMK characters" ON public.kmk_characters;
CREATE POLICY "Admins can manage KMK characters"
  ON public.kmk_characters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_kmk_characters_gender
  ON public.kmk_characters(gender);

-- 5. Clear and insert all characters
DELETE FROM public.kmk_characters;

INSERT INTO public.kmk_characters (name, gender, image_url) VALUES
('ავთო ნაცვლიშვილი', 'male', '/persons/ავთო ნაცვლიშვილი — ბესო მეგრელიშვილი.png'),
('აკაკი შუკაკიძე', 'male', '/persons/აკაკი შუკაკიძე – ირაკლი ჩხიკვაძე.png'),
('ალიოშა ბარხატაშვილი', 'male', '/persons/ალიოშა ბარხატაშვილი — ნიკა ქაცარიძე.png'),
('ანასტასია გოცირიძე', 'female', '/persons/ანასტასია გოცირიძე — ქეთა ორბელაძე.png'),
('ანკა გაბრიჩიძე', 'female', '/persons/ანკა გაბრიჩიძე — თინა მახარაძე.png'),
('აჩიკო', 'male', '/persons/აჩიკო – სოსო ხვედელიძე.png'),
('ბადრი კოლია', 'male', '/persons/ბადრი კოლია.png'),
('ბარბარე მანტკავა', 'female', '/persons/ბარბარე მანტკავა - მარიშკა ჯავახაძე.png'),
('ბაქარ ორჯონიკიძე', 'male', '/persons/ბაქარ ორჯონიკიძე — ბუბა მირცხულავა.png'),
('ბაჩო კელაპტრიშვილი', 'male', '/persons/ბაჩო კელაპტრიშვილი – კახა თოლორდავა.png'),
('ბახვა', 'male', '/persons/ბახვა.png'),
('გივიკო', 'male', '/persons/გივიკო – ნიკო კანკია.png'),
('გოგი', 'male', '/persons/გოგი – ნუგზარ ერგემლიძე.png'),
('გრიშა კაკაჩია', 'male', '/persons/გრიშა კაკაჩია — დავით კვირცხალია.png'),
('გრუშა', 'male', '/persons/გრუშა.png'),
('გურანდა (ჩიკა) მეძმარიაშვილი', 'female', '/persons/გურანდა (ჩიკა) მეძმარიაშვილი — ანი ჩირაძე.png'),
('დათო გოცირიძე', 'male', '/persons/დათო გოცირიძე — ლევან ყოჩიაშვილი.png'),
('დიტო შარაშენიძე', 'male', '/persons/დიტო შარაშენიძე — კოტე თოლორდავა.png'),
('დოჩი ალიშბაია', 'female', '/persons/დოჩი ალიშბაია — ნანუკა გულუა.png'),
('დუდუ მგელაძე', 'male', '/persons/დუდუ მგელაძე — ალეკო ბეგალიშვილი.png'),
('ეგონა გუნავა', 'female', '/persons/ეგონა გუნავა — ლაურა რეხვიაშვილი.png'),
('ეკა', 'female', '/persons/ეკა – ნანუკა ისიანი.png'),
('ენდი', 'male', '/persons/ენდი – ლექსო ჩემია.png'),
('ვატიკანა', 'male', '/persons/ვატიკანა.png'),
('ვეკო', 'male', '/persons/ვეკო.png'),
('ვერსკი', 'male', '/persons/ვერსკი.png'),
('ვიკა', 'female', '/persons/ვიკა – ია ვახანია.png'),
('ზაზა მანაგაძე', 'male', '/persons/ზაზა მანაგაძე — გიორგი ბოჭორიშვილი.png'),
('ზვიად დიასამიძე', 'male', '/persons/ზვიად დიასამიძე — დავით ხახიძე.png'),
('ზურაშა', 'male', '/persons/ზურაშა – ირაკლი ჩხიკვიშვილი.png'),
('თამაზი', 'male', '/persons/თამაზი – გია როინიშვილი.png'),
('თამუნა იოსებიძე', 'female', '/persons/თამუნა იოსებიძე — ხატია ბრაჭული.png'),
('თამუნა მსხვილიძე', 'female', '/persons/თამუნა მსხვილიძე — ანა მჭედლიძე.png'),
('თემური', 'male', '/persons/თემური – ბექა ლემონჯავა.png'),
('თენგო მაზიაშვილი', 'male', '/persons/თენგო მაზიაშვილი — შოთიკო ნოზაძე.png'),
('თიკა', 'female', '/persons/თიკა — ვიკა კალანდია.png'),
('თინა ბრეგვაძე', 'female', '/persons/თინა ბრეგვაძე — მაკა ძაგანია.png'),
('ივა ბარხატაშვილი', 'male', '/persons/ივა ბარხატაშვილი — პაატა გულიაშვილი.png'),
('ილო', 'male', '/persons/ილო – მერაბ ნინიძე.png'),
('ირა (ძიძა)', 'female', '/persons/ირა (ძიძა) — ნანუკა ხუსკივაძე.png'),
('ირაკლი ხურცილავა', 'male', '/persons/ირაკლი ხურცილავა — ვანიკო თარხნიშვილი.png'),
('კატა ჯიქია', 'female', '/persons/კატა ჯიქია — ეკა ჩხეიძე .png'),
('კატო კირვალიძე', 'female', '/persons/კატო კირვალიძე — ნინო გაჩეჩილაძე.png'),
('კეკე', 'female', '/persons/კეკე - თაკო ჭანუყვაძე .png'),
('კვაზი მანტკავა', 'male', '/persons/კვაზი მანტკავა — ზურაბ ანთელავა.png'),
('კლარა', 'female', '/persons/კლარა – თამუნა აფშილავა.png'),
('კოჭო', 'male', '/persons/კოჭო – ჯეგე სახოკია.png'),
('კრიმხილდა', 'female', '/persons/კრიმხილდა – ნანა კუხალეიშვილი.png'),
('ლამარა ბაბუხადია', 'female', '/persons/ლამარა ბაბუხადია — მარინა დარასელია.png'),
('ლევანიკო მაღალაშვილი', 'male', '/persons/ლევანიკო მაღალაშვილი — ბუბა ჭოღოშვილი.png'),
('ლეკა', 'female', '/persons/ლეკა – ქეთი წიქვაძე.png'),
('ლეო', 'male', '/persons/ლეო — როლანდ ოქროპირიძე.png'),
('ლიკო ბერიძე', 'female', '/persons/ლიკო ბერიძე — ნათია ფარჯანაძე.png'),
('ლიკუნა კირვალიძე', 'female', '/persons/ლიკუნა კირვალიძე — ეკა ამირეჯიბი.png'),
('მაიკო', 'female', '/persons/მაიკო – ნინი ოკუჯავა.png'),
('მაკა ანჯაფარიძე', 'female', '/persons/მაკა ანჯაფარიძე — ნინო კასრაძე.png'),
('მანანა ტყეშელაშვილი', 'female', '/persons/მანანა ტყეშელაშვილი — მედეა ლორთქიფანიძე.png'),
('მანჩო', 'female', '/persons/მანჩო – თამუნა ქორქია.png'),
('მარია აზამასცევა', 'female', '/persons/მარია აზამასცევა – კარინა ყენია.png'),
('მარიამი', 'female', '/persons/მარიამი – მარიამ ცქიფურიშვილი.png'),
('მაქსიმე გობრონიძე', 'male', '/persons/მაქსიმე გობრონიძე — გიორგი მახარაძე.png'),
('მერაბ დარჩია', 'male', '/persons/მერაბ დარჩია — ზურა ნიჟარაძე.png'),
('მზიკო', 'female', '/persons/მზიკო — ზუზუ კუცია.png'),
('მთვარისა მაზიაშვილი', 'female', '/persons/მთვარისა მაზიაშვილი — ქეთი ხუციშვილი.png'),
('მიშკა ალაშვილი', 'male', '/persons/მიშკა ალაშვილი — ვახო ჩაჩანიძე.png'),
('ნათია ბარამიძე', 'female', '/persons/ნათია ბარამიძე — ნინო მუმლაძე.png'),
('ნაირა (ზაზას დედა)', 'female', '/persons/ნაირა (ზაზას დედა) — ეკა მჟავანაძე.png'),
('ნანუნა', 'female', '/persons/ნანუნა – ენდი ძიძავა.png'),
('ნატაშკა ხალვაში', 'female', '/persons/ნატაშკა ხალვაში — ეკა დემეტრაძე.png'),
('ნატო კაკაჩია', 'female', '/persons/ნატო კაკაჩია — ნატა ბერეჟიანი.png'),
('ნატრული გუნავა', 'female', '/persons/ნატრული გუნავა — მარინა კახიანი.png'),
('ნელიკო მაისურაძე', 'female', '/persons/ნელიკო მაისურაძე — ბაია დვალიშვილი.png'),
('ნიკუშა', 'male', '/persons/ნიკუშა – გიორგი შარვაშიძე.png'),
('ნინა გურაბანიძე', 'female', '/persons/ნინა გურაბანიძე — ანა ტყებუჩავა.png'),
('ნინი', 'female', '/persons/ნინი – ნატალია ყულოშვილი.png'),
('ნინო ერისთავი', 'female', '/persons/ნინო ერისთავი – თათული დოლიძე.png'),
('ნინო', 'female', '/persons/ნინო – გიორგი მარშანია.png'),
('ნუგო', 'male', '/persons/ნუგო — ვახტანგ ოქრუაშვილი.png'),
('ნუკა', 'female', '/persons/ნუკა – ანო ზურაშვილი.png'),
('ნუნუკა ქურციძე', 'female', '/persons/ნუნუკა ქურციძე — ქეთი ჩხეიძე.png'),
('ნუპო', 'male', '/persons/ნუპო – თემო ჯანაშია.png'),
('ოლეგი', 'male', '/persons/ოლეგი – ბესო ბარათაშვილი.png'),
('პაატა', 'male', '/persons/პაატა — მალხაზ აბულაძე.png'),
('რაგნარა', 'male', '/persons/რაგნარა.png'),
('როლანდ მანაგაძე', 'male', '/persons/როლანდ მანაგაძე — ალეკო მახარობლიშვილი.png'),
('რუსკა', 'female', '/persons/რუსკა – ნანა აბულაძე.png'),
('სანდრექსა', 'male', '/persons/სანდრექსა.png'),
('სანი', 'male', '/persons/სანი – გიორგი ტაბიძე.png'),
('ტონი', 'male', '/persons/ტონი – გიორგი სურმავა.png'),
('ფრიდრიხი', 'male', '/persons/ფრიდრიხი – სესე მიქავა.png'),
('ფროდო', 'male', '/persons/ფროდო – იმედა არაბული.png'),
('ქალთევზაშვილები', 'female', '/persons/ქალთევზაშვილები.png'),
('ქეთი (ზაზას ცოლი)', 'female', '/persons/ქეთი (ზაზას ცოლი) — სალომე შარვაძე.png'),
('ქრისტინე', 'female', '/persons/ქრისტინე – ანა ჯავახიშვილი.png'),
('ყირმისა', 'male', '/persons/ყირმისა.png'),
('შავლეგო მადლიანი', 'male', '/persons/შავლეგო მადლიანი — ილო ბეროშვილი .png'),
('შმაგი', 'male', '/persons/შმაგი – გიორგი ძამუკაშვილი.png'),
('ჩაქუჩა', 'male', '/persons/ჩაქუჩა – ლევან სუხიტაშვილი.png'),
('ცოტნე ცოტაშვილი', 'male', '/persons/ცოტნე ცოტაშვილი — გიორგი ბახუტაშვილი.png'),
('ხოსიკა', 'male', '/persons/ხოსიკა.png'),
('ჯეკო გოცირიძე', 'male', '/persons/ჯეკო გოცირიძე — გიორგი ბარბაქაძე.png'),
('ჯემალ გოცირიძე', 'male', '/persons/ჯემალ გოცირიძე — ლეო ანთაძე.png'),
-- persons2
('აკაკი შუკაკიძე', 'male', '/persons2/აკაკი შუკაკიძე.jpeg'),
('გაჩა ზვერაძე', 'male', '/persons2/გაჩა ზვერაძე.jpg'),
('დაჩი პაკელიანი', 'male', '/persons2/დაჩი პაკელიანი.jpeg'),
('დოდო მებუკე', 'male', '/persons2/დოდო მებუკე.png'),
('ელვირ სვინტრაძე', 'male', '/persons2/ელვირ სვინტრაძე.jpeg'),
('თეა', 'female', '/persons2/თეა.png'),
('კესო', 'female', '/persons2/კესო.png'),
('ლაოში', 'male', '/persons2/ლაოში.jpg'),
('ლელა ქავთარაძე', 'female', '/persons2/ლელა ქავთარაძე.png'),
('მაკო', 'female', '/persons2/მაკო.jpeg'),
('მერი კომენდანტი', 'female', '/persons2/მერი კომენდანტი.jpeg'),
('ნათია', 'female', '/persons2/ნათია.png'),
('ნაილა ხუნწარია', 'female', '/persons2/ნაილა ხუნწარია.jpg'),
('სოსო', 'male', '/persons2/სოსო.jpeg'),
('სულიკო დარდიანიძე', 'male', '/persons2/სულიკო დარდიანიძე.webp'),
('ტასიკო', 'female', '/persons2/ტასიკო.png');
