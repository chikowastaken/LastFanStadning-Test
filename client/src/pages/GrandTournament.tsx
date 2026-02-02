import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Users,
  ArrowRight,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Gift,
  CheckCircle2,
  BarChart3,
  Shield,
  Zap,
  Target,
  AlertTriangle,
  Ticket,
  Timer,
  Lock,
  Award,
  Brain,
  Flame,
  Star,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

export default function GrandTournament() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    { path: "/dashboard", label: "მთავარი", icon: Home },
    { path: "/leaderboard", label: "ლიდერბორდი", icon: BarChart3 },
    ...(isAdmin ? [{ path: "/admin", label: "ადმინი", icon: Settings }] : []),
  ];

  const handleRegister = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const prizeDistribution = [
    { place: "1", prize: "3,000₾", icon: Trophy },
    { place: "2", prize: "2,000₾", icon: Award },
    { place: "3", prize: "1,000₾", icon: Star },
    { place: "4-23", prize: "200₾", icon: CreditCard },
  ];

  const rules = [
    { icon: Clock, title: "დაწყების დრო", description: "21:00 საათი" },
    { icon: Brain, title: "კითხვების რაოდენობა", description: "სულ 40 კითხვა" },
    { icon: Timer, title: "დროის ლიმიტი", description: "20 წუთი" },
    {
      icon: AlertTriangle,
      title: "დაგვიანებით შესვლა",
      description: "5 წუთის დაგვიანებით = 15 წუთი დარჩენილი",
    },
  ];

  const features = [
    {
      icon: Gift,
      title: "რეალური ფულადი პრიზები",
      description: "მოიგეთ 10,000₾-მდე საპრიზო ფონდიდან",
    },
    {
      icon: Brain,
      title: "დაამტკიცეთ ცოდნა",
      description: "შეეჯიბრეთ საუკეთესო მოთამაშეებს",
    },
    {
      icon: Trophy,
      title: "პრესტიჟი და აღიარება",
      description: "მოიპოვეთ ადგილი ლიდერბორდზე",
    },
    {
      icon: Zap,
      title: "მაღალი ინტენსივობა",
      description: "კონკურენტული გარემო",
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "გრანდ ტურნირი - LastFanStanding",
    "description": "მასშტაბური ქვიზ ტურნირი 10,000₾ საპრიზო ფონდით",
    "startDate": "2026-02-28T21:00:00+04:00",
    "endDate": "2026-02-28T21:20:00+04:00",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "location": {
      "@type": "VirtualLocation",
      "url": "https://lastfanstanding.ge/grand-tournament"
    },
    "organizer": {
      "@type": "Organization",
      "name": "LastFanStanding",
      "url": "https://lastfanstanding.ge"
    },
    "offers": {
      "@type": "Offer",
      "price": "6.70",
      "priceCurrency": "GEL",
      "availability": "https://schema.org/InStock",
      "url": "https://lastfanstanding.ge/grand-tournament"
    },
    "image": "https://lastfanstanding.ge/images/grand-quiz-banner.png"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="გრანდ ტურნირი - მოიგე 10,000 ლარი | LastFanStanding"
        description="მიიღე მონაწილეობა გრანდ ტურნირში შაბათს, 28 თებერვალს. იბრძოლე 10,000 ლარიანი საპრიზო ფონდისთვის. დაამტკიცე შენი ცოდნა, გაიარე რეგისტრაცია და გახდი საუკეთესო ჩცდ-ს ფანი. მონაწილეობის საფასური - 6.7 ლარი"
        structuredData={structuredData}
      />
      {/* Header */}
      <Header />

      {/* Hero Section with Banner */}
      <section className="relative overflow-hidden pt-16">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 lg:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-scale-in">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">LFS-ის უმაღლესი გამოწვევა</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-in-up">
              🏆 გრანდ ტურნირი
            </h1>

            <p
              className="text-2xl md:text-3xl font-display font-bold text-primary mb-4 animate-slide-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              იბრძოლე 10,000₾-სთვის
            </p>

            <p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              თვეში ერთხელ, საუკეთესო ჩ.ც.დ-ს ფანები იკრიბებიან, რათა შეებრძოლონ
              ერთმანეთს რეალური ფულადი პრიზებისა და დიდებისთვის. ეს არ არის
              უბრალოდ ქვიზი — ეს
              <b>თქვენი პოტენციალის გამოვლინებაა</b>.
            </p>

            <Button
              variant="hero"
              size="xl"
              className="gap-2 animate-slide-in-up"
              style={{ animationDelay: "0.3s" }}
              onClick={handleRegister}
            >
              დარეგისტრირდი ახლავე
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Big Countdown Timer */}
          <div
            className="mt-12 animate-slide-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Card
              variant="glass"
              className="max-w-2xl mx-auto border-primary/20"
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center mb-8 w-full px-4">
                  <Timer className="w-8 h-8 text-primary animate-pulse mb-2" />
                  <span className="font-display text-xl font-semibold text-primary text-center max-w-md">
                    გრანდ ტურნირის დაწყებამდე დარჩა
                  </span>
                </div>
                <CountdownTimer
                  targetDate={new Date("2026-02-28T21:00:00")}
                  label=""
                />
                <p className="mt-6 text-sm text-muted-foreground text-center">
                  რეგისტრაციის დასაწყებად{" "}
                  <a href="/auth" className="text-primary underline">
                    დააჭირე აქ
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Banner Image */}
          <div className="max-w-5xl mx-auto mt-12">
            <img
              src="/images/grand-quiz-banner.png"
              alt="დიდი ტურნირი მოიგე 10,000₾"
              className="w-full h-auto object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Prize Pool Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              💰 საპრიზო ფონდი 10,000₾
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ტოპ 5 მოთამაშე გაინაწილებს 10,000₾-ის ოდენობის საპრიზო ფონდს.
              რეალური ფულადი ჯილდოები.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {prizeDistribution.map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card
                  variant="elevated"
                  className={`text-center group hover:scale-105 transition-transform h-full ${index === 0 ? "md:col-span-1 ring-2 ring-primary/50" : ""}`}
                >
                  <CardContent className="pt-6 pb-4">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${index === 0 ? "bg-primary/20" : "bg-muted"}`}
                    >
                      <item.icon
                        className={`w-6 h-6 ${index === 0 ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {item.place} ადგილი
                    </p>
                    <p
                      className={`font-display text-xl font-bold ${index === 0 ? "text-primary" : "text-foreground"}`}
                    >
                      {item.prize}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              გამარჯვებულები ვლინდებიან ქულებისა და ქვიზის დასრულების დროის
              მიხედვით. მხოლოდ უძლიერესები აღწევენ მწვერვალს.
            </p>
          </div>
        </div>
      </section>

      {/* How to Join Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              🎟️ როგორ ჩავერთოთ გრანდ ტურნირში
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              მარტივი ნაბიჯები მონაწილეობისთვის
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card
                variant="glass"
                className="relative overflow-hidden group hover:scale-105 transition-transform h-full"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />
                <CardContent className="pt-8 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Ticket className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">მონაწილეობის საფასური</h3>
                  <p className="text-2xl font-display font-bold text-primary">
                    6.7₾
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card
                variant="glass"
                className="relative overflow-hidden group hover:scale-105 transition-transform h-full"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
                <CardContent className="pt-8 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">რეგისტრაცია</h3>
                  <p className="text-sm text-muted-foreground">
                    ხელმისაწვდომია ჩვენს ვებ-გვერდზე
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card
                variant="glass"
                className="relative overflow-hidden group hover:scale-105 transition-transform h-full"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-success" />
                <CardContent className="pt-8 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                    <Timer className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="font-semibold mb-2">უკუთვლა</h3>
                  <p className="text-sm text-muted-foreground">
                    ტაიმერი მოცემულია რეგისტრაციის გვერდზე
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card
                variant="glass"
                className="relative overflow-hidden group hover:scale-105 transition-transform h-full"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-warning" />
                <CardContent className="pt-8 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-warning" />
                  </div>
                  <h3 className="font-semibold mb-2">შეზღუდული წვდომა</h3>
                  <p className="text-sm text-muted-foreground">
                    რეგისტრაცია წყდება უკუთვლის დასრულებისთანავე
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                დაგვიანებული რეგისტრაცია არ დაიშვება
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Rules Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              🕘 ტურნირის წესები და ფორმატი
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ყოველი წამი გადამწყვეტია
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {rules.map((rule, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card
                  variant="elevated"
                  className="text-center group hover:scale-105 transition-transform h-full"
                >
                  <CardContent className="pt-8 pb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <rule.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{rule.title}</h3>
                    <p className="text-primary font-display font-bold">
                      {rule.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Card variant="glass">
              <CardContent className="p-6">
                <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  მნიშვნელოვანი წესები
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                    <span>
                      მომდევნო კითხვაზე გადასასვლელად უნდა უპასუხოთ მიმდინარე
                      კითხვას
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                    <span>კითხვის გამოტოვება დაუშვებელია</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Timer className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                    <span>
                      ყოველი წამი გადამწყვეტია - სისწრაფე განსაზღვრავს რეიტინგს
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Scoring Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              🧠 როგორ მუშაობს ქულების დარიცხვა
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              მხოლოდ სიზუსტე და სისწრაფე უზრუნველყოფს საპრიზო ადგილს
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <Card variant="elevated">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">სწორი პასუხები</h3>
                      <p className="text-muted-foreground">
                        ზრდის თქვენს საერთო ქულას
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="font-semibold mb-4">
                      საბოლოო რეიტინგი ეფუძნება:
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                        <Target className="w-6 h-6 text-primary" />
                        <span className="font-medium">საერთო ქულას</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                        <Timer className="w-6 h-6 text-accent" />
                        <span className="font-medium">დასრულების დროს</span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      რაც უფრო სწრაფი ხართ, მით უფრო მაღალია ადგილი
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Fair Play Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              🔒 სამართლიანი თამაში და გამჭვირვალობა
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              შედეგს განსაზღვრავს მხოლოდ თქვენი ცოდნა და სისხარტე
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card
                variant="glass"
                className="text-center group hover:scale-105 transition-transform h-full"
              >
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">ერთი მცდელობა</h3>
                  <p className="text-sm text-muted-foreground">
                    თითო მოთამაშეს აქვს მხოლოდ ერთი შანსი
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card
                variant="glass"
                className="text-center group hover:scale-105 transition-transform h-full"
              >
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">დაცული სისტემა</h3>
                  <p className="text-sm text-muted-foreground">
                    ანტი-თაღლითური მონიტორინგი
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card
                variant="glass"
                className="text-center group hover:scale-105 transition-transform h-full"
              >
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-7 h-7 text-success" />
                  </div>
                  <h3 className="font-semibold mb-2">სრული გამჭვირვალობა</h3>
                  <p className="text-sm text-muted-foreground">
                    რეიტინგებსა და შედეგებში
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* <Card variant="glass" className="text-center group hover:scale-105 transition-transform">
                            <CardContent className="pt-8 pb-6">
                                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
                                    <Brain className="w-7 h-7 text-warning" />
                                </div>
                                <h3 className="font-semibold mb-2">მხოლოდ ცოდნა</h3>
                                <p className="text-sm text-muted-foreground">თქვენი ცოდნა განსაზღვრავს შედეგს</p>
                            </CardContent>
                        </Card> */}
          </motion.div>
        </div>
      </section>

      {/* Why Participate Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              🔥 რატომ უნდა მიიღოთ მონაწილეობა?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ეს არის LFS-ის შეჯიბრის უმაღლესი დონე
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card
                  variant="elevated"
                  className="text-center group hover:scale-105 transition-transform h-full"
                >
                  <CardContent className="pt-8 pb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary mb-4 shadow-glow group-hover:scale-110 transition-transform">
                      <feature.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/10 to-transparent rounded-full" />
        </div>

        <motion.div
          className="relative z-10 container mx-auto px-4 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow mb-8">
            <Flame className="w-10 h-10 text-primary-foreground" />
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            🚀 მზად ხართ?
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            დარეგისტრირდით ახლავე, მოემზადეთ და გამოიყენეთ შანსი 10,000₾-იანი
            საპრიზო ფონდის მოსაგებად. გამოწვევა იწყება 28 თებერვალს 21:00
            საათზე.
          </p>

          <p className="text-xl font-display font-bold text-primary mb-8">
            გაიმარჯვებენ მხოლოდ საუკეთესონი.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="xl"
              className="gap-2"
              onClick={handleRegister}
            >
              დარეგისტრირდი ახლავე
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Link to="/">
              <Button variant="outline" size="xl" className="gap-2">
                <Home className="w-5 h-5" />
                მთავარ გვერდზე დაბრუნება
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
