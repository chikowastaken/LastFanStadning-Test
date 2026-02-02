import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy, Zap, Users, Target, Star, Award, ArrowRight, Brain, BarChart3,
  Clock, Calendar, Gift, CheckCircle2,
  HelpCircle, Play, Archive, Repeat
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

// Animation variants for reusable animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartGame = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const faqItems = [
    {
      question: "როდის ქვეყნდება ახალი ქვიზი?",
      answer: "ახალი ქვიზი ყოველდღე 21:00 საათზე ქვეყნდება. თქვენ გაქვთ 24 საათი მის შესასრულებლად სრული ქულების მისაღებად."
    },
    {
      question: "რამდენ ქულას ვიღებ სწორ პასუხზე?",
      answer: "Live ქვიზზე თითოეულ სწორ პასუხზე იღებთ 10 ქულას. არქივის ქვიზზე პირველად შესრულებისას - 5 ქულას. მეორედ თამაში ქულებს აღარ მოგცემთ."
    },
    {
      question: "რა არის არქივის ქვიზი?",
      answer: "არქივში ხვდება ყველა წინა ქვიზი. თუ გამოტოვეთ რომელიმე დღის ქვიზი, შეგიძლიათ არქივიდან ითამაშოთ და მიიღოთ 5 ქულა თითო სწორ პასუხზე."
    },
    {
      question: "როგორ მუშაობს ტურნირი?",
      answer: "ტურნირი ტარდება შაბათობით. საჭიროა წინასწარი რეგისტრაცია. ტურნირის დაწყების შემდეგ ახალი მონაწილეების მიღება აღარ ხდება. გამარჯვებულებს ელით პრიზები."
    },
    {
      question: "როგორ ვიღებ პრიზს?",
      answer: "ტურნირის დასრულების შემდეგ გამარჯვებულებს დაუკავშირდება ადმინისტრაცია პრიზის გადაცემის მიზნით."
    },
    {
      question: "შემიძლია რამდენჯერმე ვითამაშო იგივე ქვიზი?",
      answer: "დიახ, შეგიძლიათ ქვიზის გამეორება, მაგრამ ქულებს მიიღებთ მხოლოდ პირველად შესრულებისას. განმეორებით თამაში გართობისთვისაა."
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LastFanStanding",
    "alternateName": "LFS",
    "url": "https://lastfanstanding.ge",
    "description": "ყოველდღიური ქვიზები ჩემი ცოლის დაქალებზე. შეეჯიბრე მეგობრებს და მოიგე პრიზები.",
    "inLanguage": "ka-GE",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://lastfanstanding.ge/dashboard?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="LastFanStanding - ითამაშე ჩცდ-ს ქვიზები და გამოსცადე შენი ცოდნა"
        description="შემოუერთდი LFS-ს, უპასუხე ყოველდღიურად 10 ახალ კითხვას 21:00 საათზე. დააგროვე ქულები, შეეჯიბრე მეგობრებს და მოხვდი ლიდერბორდში. მიიღე მონაწილეობა გრანდ ტურნირში და იბრძოლე 10,000 ლარიანი საპრიზო ფონდისთვის"
        keywords="ქვიზები, ჩემი ცოლის დაქალები, ჩცდ, LastFanStanding, LFS, ყოველდღიური ქვიზი, ჩემი ცოლის დაქალების ქვიზი, ჩცდ ქვიზები, ჩცდ ქვიზი, გრადნტურნირი"
        structuredData={structuredData}
      />
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8 animate-scale-in">
              <img
                src="/images/horizontal-full-logo-text.png"
                alt="LastFanStanding Logo"
                className="h-20 w-auto object-contain"
              />
            </div>

            <p className="text-xl md:text-2xl text-muted-foreground mb-6 animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
              ყოველდღე 21:00-ზე ახალი 10 კითხვა. 24 საათი პასუხისთვის. ქულები და რეიტინგი.
            </p>

            {/* Scoring bullets */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">Live ქვიზი: 10 ქულა</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent">
                <Archive className="w-4 h-4" />
                <span className="text-sm font-medium">არქივი: 5 ქულა</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
                <Repeat className="w-4 h-4" />
                <span className="text-sm font-medium">გამეორება: გართობა</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" className="w-full sm:w-auto gap-2" onClick={handleStartGame}>
                დაიწყე თამაში
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Link to="/leaderboard">
                <Button variant="outline" size="xl" className="w-full sm:w-auto gap-2">
                  <Trophy className="w-5 h-5" />
                  ლიდერბორდის ნახვა
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grand Quiz Banner */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Link to="/grand-tournament" className="block w-full max-w-6xl mx-auto">
            <img
              src="/images/grand-quiz-banner.png"
              alt="Grand Quiz - Win 10,000 - Saturday, 28th of February"
              className="w-full h-auto object-contain rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            />
          </Link>
        </div>
      </section>

      {/* Daily Schedule Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
              ყოველდღიური განრიგი
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              მარტივი და რეგულარული. ყოველდღე ახალი გამოწვევა ერთსა და იმავე დროს.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card variant="elevated" className="text-center group hover:scale-105 transition-transform h-full">
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3">21:00 - ქვიზის გამოქვეყნება</h3>
                  <p className="text-muted-foreground">
                    ყოველდღე საღამოს 9 საათზე ახალი 10-კითხვიანი ქვიზი გელოდებათ.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card variant="elevated" className="text-center group hover:scale-105 transition-transform h-full">
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-6 group-hover:bg-accent/20 transition-colors">
                    <Zap className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3">24 საათი დროა</h3>
                  <p className="text-muted-foreground">
                    სრული ქულების მისაღებად შეასრულეთ ქვიზი 24 საათის განმავლობაში.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card variant="elevated" className="text-center group hover:scale-105 transition-transform h-full">
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 mb-6 group-hover:bg-success/20 transition-colors">
                    <Archive className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3">არქივში გადადის</h3>
                  <p className="text-muted-foreground">
                    დროის ამოწურვის შემდეგ ქვიზი არქივში გადადის, სადაც შემცირებული ქულებით ითამაშებთ.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Scoring System Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
              ქულების სისტემა
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              გამჭვირვალე და სამართლიანი. რაც უფრო აქტიური ხარ, მით მეტ ქულას აგროვებ.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card variant="glass" className="relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-primary">10 ქულა</p>
                      <p className="text-sm text-muted-foreground">თითო სწორ პასუხზე</p>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Live ქვიზი</h3>
                  <p className="text-sm text-muted-foreground">
                    დღის ქვიზზე 24-საათიან ფანჯარაში თითოეულ სწორ პასუხზე სრულ 10 ქულას იღებთ.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card variant="glass" className="relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Archive className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-accent">5 ქულა</p>
                      <p className="text-sm text-muted-foreground">პირველად შესრულებაზე</p>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">არქივის ქვიზი</h3>
                  <p className="text-sm text-muted-foreground">
                    გამოტოვებული ქვიზის არქივიდან შესრულებისას პირველად თამაშზე იღებთ 5 ქულას.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card variant="glass" className="relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-muted-foreground/50" />
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Repeat className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-muted-foreground">0 ქულა</p>
                      <p className="text-sm text-muted-foreground">მხოლოდ გართობა</p>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">განმეორებით თამაში</h3>
                  <p className="text-sm text-muted-foreground">
                    უკვე შესრულებული ქვიზის გამეორება შესაძლებელია, მაგრამ ქულები აღარ დაგეწერებათ.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tournament Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">ყოველ შაბათს</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              შაბათის ტურნირი პრიზებით
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              კვირაში ერთხელ გამართული სპეციალური ტურნირი, სადაც საუკეთესო მოთამაშეები იღებენ პრიზებს.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">წინასწარი რეგისტრაცია</h3>
                <p className="text-sm text-muted-foreground">
                  ტურნირში მონაწილეობისთვის აუცილებელია წინასწარ დარეგისტრირება.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mb-4">
                  <Clock className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">შესვლა იზღუდება</h3>
                <p className="text-sm text-muted-foreground">
                  ტურნირის დაწყების შემდეგ ახალი მონაწილეების მიღება აღარ ხდება.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 mb-4">
                  <Gift className="w-7 h-7 text-success" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">პრიზები გამარჯვებულებს</h3>
                <p className="text-sm text-muted-foreground">
                  საუკეთესო შედეგის მქონე მონაწილეები იღებენ ფულად პრიზებს.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 flex justify-center">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="outline" size="lg" className="gap-2">
                <Trophy className="w-5 h-5" />
                შედი და ნახე ტურნირები
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
              რატომ LastFanStanding.ge?
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              უფრო მეტი, ვიდრე უბრალოდ ქვიზი. ეს არის კონკურენცია და გართობა.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card variant="elevated" className="group hover:scale-105 transition-transform h-full">
                <CardContent className="pt-6 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">განავითარე ცოდნა</h3>
                  <p className="text-sm text-muted-foreground">
                    მრავალფეროვანი კითხვები სერიალი "ჩემი ცოლის დაქალები"-ზე.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card variant="elevated" className="group hover:scale-105 transition-transform h-full">
                <CardContent className="pt-6 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">შეეჯიბრე მეგობრებს</h3>
                  <p className="text-sm text-muted-foreground">
                    გლობალური და კვირეული ლიდერბორდები.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card variant="elevated" className="group hover:scale-105 transition-transform h-full">
                <CardContent className="pt-6 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4 group-hover:bg-success/20 transition-colors">
                    <Gift className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="font-semibold mb-2">მოიგე პრიზები</h3>
                  <p className="text-sm text-muted-foreground">
                    ტურნირებში გამარჯვებულებს ელით პრიზები.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card variant="elevated" className="group hover:scale-105 transition-transform h-full">
                <CardContent className="pt-6 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                    <CheckCircle2 className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">100% უფასო</h3>
                  <p className="text-sm text-muted-foreground">
                    რეგისტრაცია და თამაში სრულიად უფასოა.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center" variants={fadeInUp}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <p className="font-display text-3xl md:text-4xl font-bold text-foreground">∞</p>
              <p className="text-muted-foreground">ქვიზები</p>
            </motion.div>
            <motion.div className="text-center" variants={fadeInUp}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-4">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <p className="font-display text-3xl md:text-4xl font-bold text-foreground">100+</p>
              <p className="text-muted-foreground">კითხვები</p>
            </motion.div>
            <motion.div className="text-center" variants={fadeInUp}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 mb-4">
                <Users className="w-6 h-6 text-success" />
              </div>
              <p className="font-display text-3xl md:text-4xl font-bold text-foreground">1000+</p>
              <p className="text-muted-foreground">მონაწილეები</p>
            </motion.div>
            <motion.div className="text-center" variants={fadeInUp}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 mb-4">
                <Trophy className="w-6 h-6 text-destructive" />
              </div>
              <p className="font-display text-3xl md:text-4xl font-bold text-foreground">50K+</p>
              <p className="text-muted-foreground">დაჯილდოებული ქულები</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
              <HelpCircle className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              ხშირად დასმული კითხვები
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              პასუხები ყველაზე გავრცელებულ კითხვებზე LFS-ის შესახებ.
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 overflow-hidden"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <motion.div
          className="container mx-auto px-4 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            მზად ხარ გამოწვევისთვის?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            შეუერთდი LFS-ს დღესვე. უფასო რეგისტრაცია, ყოველდღიური ქვიზები და შანსი მოიგო პრიზები.
          </p>
          <Button variant="hero" size="xl" className="gap-2" onClick={handleStartGame}>
            <span className="hidden sm:inline">{user ? "გადადი ქვიზებზე" : "შექმენი ანგარიში და დაიწყე"}</span>
            <span className="sm:hidden">{user ? "გადადი ქვიზებზე" : "შექმენი ანგარიში"}</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
