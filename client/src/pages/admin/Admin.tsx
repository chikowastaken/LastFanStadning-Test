import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, Trophy, HelpCircle, Upload, FileSpreadsheet } from "lucide-react";

export default function Admin() {
    const adminLinks = [
        { to: "/admin/quizzes", label: "Quizzes", icon: Calendar, description: "Manage daily quizzes" },
        { to: "/admin/tournaments", label: "Tournaments", icon: Trophy, description: "Manage tournaments" },
        { to: "/admin/questions", label: "Questions", icon: HelpCircle, description: "Manage questions" },
        { to: "/admin/import/questions", label: "CSV Import Questions", icon: Upload, description: "Import questions from CSV" },
    ];

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
                <Card variant="elevated">
                    <CardHeader>
                        <h1 className="text-2xl font-bold">Admin Panel</h1>
                        <p className="text-sm text-muted-foreground">
                            Create quizzes, manage questions, and import CSV files.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {adminLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="rounded-lg border p-4 hover:bg-secondary/40 transition flex items-start gap-3"
                                >
                                    <link.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-medium">{link.label}</div>
                                        <div className="text-xs text-muted-foreground">{link.description}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}