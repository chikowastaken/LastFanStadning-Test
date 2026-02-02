import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Clock,
  Calendar,
  Gift,
  CheckCircle2,
  Timer,
  Archive,
  Repeat,
  Users,
  AlertTriangle,
  Target,
  Award,
  CreditCard,
  Mail,
  Lock,
  SkipForward,
  Ban,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Terms() {
  const prizeDistribution = [
    { place: "I ადგილი", prize: "3,000 ლარი" },
    { place: "II ადგილი", prize: "2,000 ლარი" },
    { place: "III ადგილი", prize: "1,000 ლარი" },
    { place: "IV - XXIII ადგილი", prize: "200₾ სითი მოლის ვაუჩერი" },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "როდის ქვეყნდება ყოველდღიური ქვიზი?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ყოველდღე, 21:00 საათზე, საიტზე იდება ახალი ქვიზი, რომელში მონაწილეობაც უფასოა."
        }
      },
      {
        "@type": "Question",
        "name": "რა არის საპრიზო ფონდი გრანდ ტურნირში?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "გრანდ ტურნირის საპრიზო ფონდია 10,000 ლარი, რომელიც ნაწილდება ტოპ 23 მოთამაშეს შორის."
        }
      },
      {
        "@type": "Question",
        "name": "როგორ მუშაობს ქულების სისტემა?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Live ქვიზზე თითოეულ სწორ პასუხზე იღებთ 10 ქულას. არქივის ქვიზზე პირველად შესრულებისას - 5 ქულას."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="წესები და ინსტრუქცია | LastFanStanding"
        description="გაეცანით LastFanStanding-ის წესებს, საპრიზო ფონდებსა და მონაწილეობის პირობებს. ყოველდღიური ქვიზები, შაბათის ქვიზები და გრანდ ტურნირი."
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
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">ინსტრუქცია და წესები</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              ქვიზების წესები
            </h1>
            <p className="text-lg text-muted-foreground">
              გაეცანით ჩვენი პლატფორმის წესებს, საპრიზო ფონდებსა და მონაწილეობის
              პირობებს.
            </p>
          </div>
        </div>
      </section>

      {/* Daily Quizzes Section */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            📅 ყოველდღიური ქვიზები
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">გამოქვეყნების დრო</h3>
                <p className="text-sm text-muted-foreground">
                  ყოველდღე, 21:00 საათზე, საიტზე იდება ახალი ქვიზი, რომელში
                  მონაწილეობაც უფასოა.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">ქულების სისტემა</h3>
                <p className="text-sm text-muted-foreground">
                  მაქსიმალური ქულის (100 ქულა) მოსაპოვებლად საჭიროა ქვიზის
                  დასრულება მისი გამოქვეყნებიდან 24 საათის განმავლობაში.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                  <Archive className="w-5 h-5 text-warning" />
                </div>
                <h3 className="font-semibold mb-2">არქივი</h3>
                <p className="text-sm text-muted-foreground">
                  24 საათის შემდეგ ქვიზი გადადის არქივში, სადაც მისი პირველადად
                  გავლისას მაქსიმუმ 50 ქულის მოპოვებაა შესაძლებელი.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <SkipForward className="w-5 h-5 text-success" />
                </div>
                <h3 className="font-semibold mb-2">
                  მსვლელობა (თავისუფალი რეჟიმი)
                </h3>
                <p className="text-sm text-muted-foreground">
                  შეგიძლიათ გადახვიდეთ მომდევნო შეკითხვებზე და შემდეგ ისევ
                  დაუბრუნდეთ გამოტოვებულ კითხვებს. პასუხის შეცვლა შესაძლებელია
                  ქვიზის დასრულებამდე.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Repeat className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">გამეორება</h3>
                <p className="text-sm text-muted-foreground">
                  უკვე დასრულებული ქვიზის ხელმეორედ გავლა შესაძლებელია მხოლოდ
                  გასართობად (ქულები რეიტინგში აღარ აისახება).
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">შედეგები</h3>
                <p className="text-sm text-muted-foreground">
                  დასრულებისთანავე იხილავთ თქვენს ქულას და სწორ პასუხებს.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Saturday Quizzes Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            🌟 შაბათის ქვიზები
          </h2>

          <Card variant="glass" className="mb-6">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                ყოველ შაბათს, <strong>21:00 საათზე</strong>, ტარდება სპეციალური{" "}
                <strong>20-შეკითხვიანი</strong> ქვიზი, რომელშიც ასევე იქნება
                პრიზები.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">რეგისტრაცია</h3>
                <p className="text-sm text-muted-foreground">
                  მონაწილეობისთვის აუცილებელია რეგისტრაცია, რომელიც იწყება 24
                  საათით ადრე — პარასკევს, 21:00 საათზე.{" "}
                  <strong>რეგისტრაცია უფასოა.</strong>
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <Timer className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2">დროის ლიმიტი</h3>
                <p className="text-sm text-muted-foreground">
                  ქვიზის შესასრულებლად გაქვთ <strong>10 წუთი</strong>. დროის
                  ამოწურვისთანავე სისტემა ავტომატურად ასრულებს თამაშს.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-warning" />
                </div>
                <h3 className="font-semibold mb-2">მსვლელობა (მკაცრი რეჟიმი)</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="flex items-start gap-2 mb-2">
                    <Ban className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    მომდევნო შეკითხვაზე გადასვლა შეუძლებელია პასუხის გარეშე
                  </span>
                  <span className="flex items-start gap-2">
                    <Ban className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    უკვე ნაპასუხებ შეკითხვაზე დაბრუნება დაუშვებელია
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <Gift className="w-5 h-5 text-success" />
                </div>
                <h3 className="font-semibold mb-2">პრიზები</h3>
                <p className="text-sm text-muted-foreground">
                  ტოპ 5 მოთამაშე საჩუქრად მიიღებს „სითი მოლის"{" "}
                  <strong>100-ლარიან ვაუჩერს</strong>.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card variant="glass" className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">დაჯილდოება</h4>
                    <p className="text-sm text-muted-foreground">
                      გამარჯვებულები გამოვლინდებიან 24 საათში. მოგების შემთხვევაში
                      ჩვენი გუნდი დაგიკავშირდებათ რეგისტრაციისას მითითებულ
                      ელ-ფოსტაზე.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Grand Tournament Section */}
      <section className="py-12 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            🔥 გრანდ ტურნირი
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            ეს არის ჩვენი ყველაზე მასშტაბური გამოწვევა „ჩემი ცოლის დაქალების"
            ერთგული ფანებისთვის!
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4 text-center">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">თარიღი</h3>
                <p className="text-sm text-primary font-bold">
                  28 თებერვალი, 2026
                </p>
                <p className="text-xs text-muted-foreground">შაბათი</p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4 text-center">
                <CreditCard className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">რეგისტრაცია</h3>
                <p className="text-sm text-accent font-bold">6,70 ლარი</p>
                <p className="text-xs text-muted-foreground">
                  ონლაინ გადახდით
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4 text-center">
                <Target className="w-8 h-8 text-success mx-auto mb-3" />
                <h3 className="font-semibold mb-1">ფორმატი</h3>
                <p className="text-sm text-success font-bold">40 შეკითხვა</p>
                <p className="text-xs text-muted-foreground">20 წუთი</p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="h-full">
              <CardContent className="pt-6 pb-4 text-center">
                <Lock className="w-8 h-8 text-warning mx-auto mb-3" />
                <h3 className="font-semibold mb-1">მსვლელობა</h3>
                <p className="text-sm text-warning font-bold">მკაცრი რეჟიმი</p>
                <p className="text-xs text-muted-foreground">
                  გამოტოვება შეუძლებელია
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Prize Pool */}
          <Card variant="glass" className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-display text-xl font-bold">
                    💰 საპრიზო ფონდი
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    10,000 ლარი
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">
                        ადგილი
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        პრიზი
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizeDistribution.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-2">
                            {index === 0 && (
                              <Trophy className="w-5 h-5 text-yellow-500" />
                            )}
                            {index === 1 && (
                              <Award className="w-5 h-5 text-gray-400" />
                            )}
                            {index === 2 && (
                              <Award className="w-5 h-5 text-amber-600" />
                            )}
                            {index === 3 && (
                              <Gift className="w-5 h-5 text-primary" />
                            )}
                            {item.place}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-primary">
                          {item.prize}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card variant="elevated" className="border-warning/30 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong>შენიშვნა:</strong> რეგისტრაციის დაწყების შესახებ ჩვენი
                    სოციალური ქსელების მეშვეობით შეგატყობინებთ. რეგისტრაცია
                    დასრულებულად ითვლება ონლაინ გადახდის დადასტურებისთანავე.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
