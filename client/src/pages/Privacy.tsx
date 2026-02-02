import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Database,
  Eye,
  Lock,
  Users,
  Clock,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  Globe,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Privacy() {
  const lastUpdated = "1 თებერვალი, 2026";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "კონფიდენციალურობის პოლიტიკა",
    "description": "LastFanStanding-ის კონფიდენციალურობის პოლიტიკა",
    "publisher": {
      "@type": "Organization",
      "name": "LastFanStanding",
      "url": "https://lastfanstanding.ge"
    },
    "dateModified": "2026-02-01"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="კონფიდენციალურობის პოლიტიკა | LastFanStanding"
        description="LastFanStanding-ის კონფიდენციალურობის პოლიტიკა. გაეცანით როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს პერსონალურ მონაცემებს."
        structuredData={structuredData}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">კონფიდენციალურობა</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 px-6 break-words">
              კონფიდენციალურობის პოლიტიკა
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-4 px-4">
              თქვენი პირადი მონაცემების დაცვა ჩვენი პრიორიტეტია
            </p>
            <p className="text-sm text-muted-foreground">
              ბოლო განახლება: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card variant="glass" className="border-primary/20">
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed">
                კეთილი იყოს თქვენი მობრძანება LastFanStanding-ზე („ჩვენ", „ჩვენი"
                ან „პლატფორმა"). ეს კონფიდენციალურობის პოლიტიკა განმარტავს,
                როგორ ვაგროვებთ, ვიყენებთ, ვინახავთ და ვიცავთ თქვენს პერსონალურ
                მონაცემებს, როდესაც იყენებთ ჩვენს ვებსაიტს{" "}
                <strong>lastfanstanding.ge</strong>-ს და მასთან დაკავშირებულ
                სერვისებს.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What Data We Collect */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            📊 რა მონაცემებს ვაგროვებთ
          </h2>

          <div className="space-y-6">
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      ანგარიშის ინფორმაცია
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Google-ით ავტორიზაციისას ვიღებთ:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        ელექტრონული ფოსტის მისამართი
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        სახელი და გვარი (Google პროფილიდან)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        პროფილის სურათი (Google პროფილიდან)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">პროფილის მონაცემები</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      თქვენ მიერ შექმნილი ან შეცვლილი ინფორმაცია:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        მომხმარებლის სახელი (username)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        ქულები და რეიტინგი
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      თამაშის აქტივობის მონაცემები
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      ქვიზებსა და ტურნირებში მონაწილეობისას:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        ქვიზების შედეგები და პასუხები
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        ტურნირებში მონაწილეობის ისტორია
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        შესრულების დრო და სტატისტიკა
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">ტექნიკური მონაცემები</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      ავტომატურად შეგროვებული ინფორმაცია:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        IP მისამართი
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        ბრაუზერის ტიპი და ვერსია
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        მოწყობილობის ინფორმაცია
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How We Use Data */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            🎯 როგორ ვიყენებთ მონაცემებს
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="elevated" className="h-full">
              <CardContent className="p-6">
                <Eye className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">სერვისის გაუმჯობესება</h3>
                <p className="text-sm text-muted-foreground">
                  თქვენი აქტივობის მონაცემები გვეხმარება პლატფორმის
                  ფუნქციონალის გაუმჯობესებაში და ახალი ფუნქციების შექმნაში.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-semibold mb-2">რეიტინგი და ლიდერბორდი</h3>
                <p className="text-sm text-muted-foreground">
                  თქვენი მომხმარებლის სახელი და ქულები გამოჩნდება საჯარო
                  ლიდერბორდში სხვა მოთამაშეებთან შეჯიბრისთვის.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="p-6">
                <Mail className="w-8 h-8 text-success mb-4" />
                <h3 className="font-semibold mb-2">კომუნიკაცია</h3>
                <p className="text-sm text-muted-foreground">
                  ელ. ფოსტას ვიყენებთ ტურნირში გამარჯვების შემთხვევაში
                  დასაკავშირებლად და მნიშვნელოვანი განახლებების
                  შესატყობინებლად.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="p-6">
                <Shield className="w-8 h-8 text-warning mb-4" />
                <h3 className="font-semibold mb-2">უსაფრთხოება</h3>
                <p className="text-sm text-muted-foreground">
                  ტექნიკურ მონაცემებს ვიყენებთ თაღლითობის პრევენციისა და
                  პლატფორმის უსაფრთხოების უზრუნველსაყოფად.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Google Authentication */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            🔐 Google ავტორიზაცია
          </h2>
          <Card variant="elevated">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                ჩვენ ვიყენებთ Google OAuth 2.0-ს ავტორიზაციისთვის. ეს ნიშნავს,
                რომ:
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    თქვენი Google პაროლი არასოდეს გაგვიზიარებთ და არ ვინახავთ
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    მხოლოდ საჯარო პროფილის ინფორმაციას ვიღებთ (სახელი, ელ.
                    ფოსტა, სურათი)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    ნებისმიერ დროს შეგიძლიათ გააუქმოთ წვდომა თქვენი Google
                    ანგარიშის პარამეტრებიდან
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Sharing */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            🤝 მონაცემების გაზიარება
          </h2>
          <Card variant="elevated">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                ჩვენ <strong>არ ვყიდით</strong> თქვენს პერსონალურ მონაცემებს.
                მონაცემები შეიძლება გაზიარდეს მხოლოდ შემდეგ შემთხვევებში:
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <span>
                    <strong>საჯარო ლიდერბორდი:</strong> თქვენი მომხმარებლის
                    სახელი და ქულები ხილულია სხვა მოთამაშეებისთვის
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <span>
                    <strong>სერვის პროვაიდერები:</strong> Supabase (მონაცემთა
                    ბაზა), Vercel (ჰოსტინგი), Cloudflare (CDN)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <span>
                    <strong>კანონის მოთხოვნა:</strong> თუ კანონი მოითხოვს
                    მონაცემების გამჟღავნებას
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Retention */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            ⏰ მონაცემების შენახვა
          </h2>
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Clock className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <p className="text-muted-foreground mb-4">
                    თქვენი მონაცემები ინახება მანამ, სანამ თქვენი ანგარიში
                    აქტიურია. ანგარიშის წაშლის მოთხოვნის შემთხვევაში:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      პერსონალური მონაცემები წაიშლება 30 დღის განმავლობაში
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      თამაშის სტატისტიკა შეიძლება შენარჩუნდეს ანონიმურად
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Rights */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            ⚖️ თქვენი უფლებები
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="elevated" className="h-full">
              <CardContent className="p-6">
                <Eye className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">წვდომის უფლება</h3>
                <p className="text-sm text-muted-foreground">
                  შეგიძლიათ მოითხოვოთ თქვენს შესახებ შეგროვებული მონაცემების
                  ასლი.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="p-6">
                <RefreshCw className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-semibold mb-2">შესწორების უფლება</h3>
                <p className="text-sm text-muted-foreground">
                  შეგიძლიათ განაახლოთ ან შეასწოროთ თქვენი პროფილის ინფორმაცია
                  ნებისმიერ დროს.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="p-6">
                <Trash2 className="w-8 h-8 text-destructive mb-4" />
                <h3 className="font-semibold mb-2">წაშლის უფლება</h3>
                <p className="text-sm text-muted-foreground">
                  შეგიძლიათ მოითხოვოთ თქვენი ანგარიშისა და მონაცემების სრული
                  წაშლა.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="p-6">
                <Lock className="w-8 h-8 text-warning mb-4" />
                <h3 className="font-semibold mb-2">შეზღუდვის უფლება</h3>
                <p className="text-sm text-muted-foreground">
                  შეგიძლიათ მოითხოვოთ თქვენი მონაცემების დამუშავების შეზღუდვა
                  გარკვეულ შემთხვევებში.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cookies */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            🍪 ქუქი-ფაილები
          </h2>
          <Card variant="elevated">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                ჩვენ ვიყენებთ მხოლოდ აუცილებელ ქუქი-ფაილებს:
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    <strong>სესიის ქუქი:</strong> ავტორიზაციის სესიის
                    შესანარჩუნებლად
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    <strong>Local Storage:</strong> თამაშის პროგრესის დროებით
                    შესანახად
                  </span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                ჩვენ <strong>არ ვიყენებთ</strong> სარეკლამო ან თვალთვალის
                ქუქი-ფაილებს.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Children's Privacy */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            👶 არასრულწლოვანთა კონფიდენციალურობა
          </h2>
          <Card variant="elevated">
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                ჩვენი სერვისი განკუთვნილია 16 წელს ზემოთ ასაკის პირებისთვის.
                ჩვენ შეგნებულად არ ვაგროვებთ 16 წლამდე ასაკის პირების
                მონაცემებს. თუ გაიგებთ, რომ არასრულწლოვანმა დარეგისტრირდა ჩვენს
                პლატფორმაზე, გთხოვთ დაგვიკავშირდეთ და ჩვენ დაუყოვნებლივ წავშლით
                მის ანგარიშს.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Policy Updates */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            🔄 პოლიტიკის განახლება
          </h2>
          <Card variant="elevated">
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                ჩვენ შეიძლება პერიოდულად განვაახლოთ ეს კონფიდენციალურობის
                პოლიტიკა. მნიშვნელოვანი ცვლილებების შემთხვევაში
                შეგატყობინებთ ელექტრონული ფოსტით ან ვებსაიტზე შეტყობინების
                გამოქვეყნებით. გირჩევთ პერიოდულად გადახედოთ ამ გვერდს.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            📧 კონტაქტი
          </h2>
          <Card variant="glass" className="border-primary/20">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                თუ გაქვთ შეკითხვები ამ კონფიდენციალურობის პოლიტიკის ან თქვენი
                მონაცემების შესახებ, გთხოვთ დაგვიკავშირდეთ:
              </p>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <a
                  href="mailto:lastfanstanding07@gmail.com"
                  className="text-primary hover:underline"
                >
                  lastfanstanding07@gmail.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
