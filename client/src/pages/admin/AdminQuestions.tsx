/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { inputBase, textareaBase, selectBase, buttonPrimary, buttonSecondary, buttonDestructive, cardBase, listContainer, listHeader } from "@/lib/admin-styles";
import { adminQuestionApi } from "@/lib/api/admin";
import { sanitizeTitle, sanitizeAnswer } from "@/lib/sanitize";

type QuizMini = {
    id: string;
    title: string;
    day_number: number;
    start_at: string;
    quiz_type: string;
};

type QuestionRow = {
    id: string;
    quiz_id: string;
    question_text: string;
    question_type: "multiple_choice" | "text_input";
    options: string[] | null;
    correct_answer: string;
    points: number;
    order_index: number;
};

export default function AdminQuestions() {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState<QuizMini[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState<string>("");

    const [questions, setQuestions] = useState<QuestionRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Form
    const [editingId, setEditingId] = useState<string | null>(null);
    const [questionText, setQuestionText] = useState("");
    const [questionType, setQuestionType] = useState<"multiple_choice" | "text_input">("multiple_choice");
    const [optionsJson, setOptionsJson] = useState('["A","B","C","D"]');
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [points, setPoints] = useState(10);
    const [orderIndex, setOrderIndex] = useState(1);

    const resetForm = useCallback(() => {
        setEditingId(null);
        setQuestionText("");
        setQuestionType("multiple_choice");
        setOptionsJson('["A","B","C","D"]');
        setCorrectAnswer("");
        setPoints(10);
        const nextIndex = (questions?.[questions.length - 1]?.order_index ?? 0) + 1;
        setOrderIndex(nextIndex || 1);
    }, [questions]);

    const fetchQuizzes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("quizzes")
                .select("id,title,day_number,start_at,quiz_type")
                .order("day_number", { ascending: false });

            if (error) throw error;

            setQuizzes((data ?? []) as QuizMini[]);
            if (!selectedQuizId && data?.[0]?.id) {
                setSelectedQuizId(data[0].id);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "შეცდომა", description: error.message });
        }
    }, [selectedQuizId, toast]);

    const fetchQuestions = useCallback(async (quizId: string) => {
        setLoading(true);
        try {
            const result = await adminQuestionApi.getByQuiz(quizId);
            setQuestions(result.questions as QuestionRow[]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "უცნობი შეცდომა";
            toast({ variant: "destructive", title: "შეცდომა", description: errorMessage });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    useEffect(() => {
        if (selectedQuizId) {
            fetchQuestions(selectedQuizId);
            // Reset form for new quiz selection
            setEditingId(null);
            setQuestionText("");
            setQuestionType("multiple_choice");
            setOptionsJson('["A","B","C","D"]');
            setCorrectAnswer("");
            setPoints(10);
            setOrderIndex(1);
        }
    }, [selectedQuizId, fetchQuestions]);

    // Set next order index after questions load
    useEffect(() => {
        if (!editingId && questions.length > 0) {
            const nextIndex = (questions?.[questions.length - 1]?.order_index ?? 0) + 1;
            setOrderIndex(nextIndex || 1);
        }
    }, [questions.length, editingId, questions]);

    const parsedOptions = useMemo(() => {
        if (questionType !== "multiple_choice") return null;
        try {
            const v = JSON.parse(optionsJson);
            return Array.isArray(v) ? v : "__INVALID__";
        } catch {
            return "__INVALID__";
        }
    }, [optionsJson, questionType]);

    const startEdit = useCallback((q: QuestionRow) => {
        setEditingId(q.id);
        setQuestionText(q.question_text);
        setQuestionType(q.question_type);
        setOptionsJson(q.options ? JSON.stringify(q.options) : "[]");
        setCorrectAnswer(q.correct_answer);
        setPoints(q.points);
        setOrderIndex(q.order_index);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const saveQuestion = useCallback(async () => {
        if (!selectedQuizId) {
            toast({ variant: "destructive", title: "შეცდომა", description: "ჯერ აირჩიეთ ქვიზი" });
            return;
        }
        if (!questionText.trim()) {
            toast({ variant: "destructive", title: "შეცდომა", description: "კითხვის ტექსტი აუცილებელია" });
            return;
        }
        if (!correctAnswer.trim()) {
            toast({ variant: "destructive", title: "შეცდომა", description: "სწორი პასუხი აუცილებელია" });
            return;
        }

        if (questionType === "multiple_choice") {
            if (parsedOptions === "__INVALID__") {
                toast({ variant: "destructive", title: "შეცდომა", description: "პასუხები უნდა იყოს JSON მასივი" });
                return;
            }
            if (!Array.isArray(parsedOptions)) {
                toast({ variant: "destructive", title: "შეცდომა", description: "პასუხები უნდა იყოს მასივი" });
                return;
            }
            if (!parsedOptions.includes(correctAnswer)) {
                toast({ variant: "destructive", title: "შეცდომა", description: "სწორი პასუხი უნდა ემთხვეოდეს ერთ-ერთ ვარიანტს" });
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                quiz_id: selectedQuizId,
                question_text: sanitizeTitle(questionText), // Sanitize question text
                question_type: questionType,
                options: questionType === "multiple_choice" ? parsedOptions : null,
                correct_answer: sanitizeAnswer(correctAnswer), // Sanitize correct answer
                points: Number(points),
                order_index: Number(orderIndex),
            };

            if (editingId) {
                await adminQuestionApi.update(editingId, {
                    question_text: payload.question_text,
                    question_type: payload.question_type,
                    options: Array.isArray(payload.options) ? payload.options : null,
                    correct_answer: payload.correct_answer,
                    points: payload.points,
                    order_index: payload.order_index,
                });
            } else {
                await adminQuestionApi.create({
                    ...payload,
                    options: Array.isArray(payload.options) ? payload.options : null,
                });
            }

            await fetchQuestions(selectedQuizId);
            resetForm();
            toast({ title: "შენახულია ✅", description: editingId ? "კითხვა განახლდა" : "კითხვა შეიქმნა" });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "შენახვა ვერ მოხერხდა";
            toast({ variant: "destructive", title: "შენახვა ვერ მოხერხდა", description: errorMessage });
        } finally {
            setSaving(false);
        }
    }, [selectedQuizId, questionText, correctAnswer, questionType, parsedOptions, points, orderIndex, editingId, fetchQuestions, resetForm, toast]);

    const deleteQuestion = useCallback(async (id: string) => {
        if (!confirm("წაშალოთ ეს კითხვა?")) return;

        setDeleting(id);
        try {
            await adminQuestionApi.delete(id);
            await fetchQuestions(selectedQuizId);
            if (editingId === id) resetForm();
            toast({ title: "წაიშალა", description: "კითხვა წარმატებით წაიშალა" });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "წაშლა ვერ მოხერხდა";
            toast({ variant: "destructive", title: "წაშლა ვერ მოხერხდა", description: errorMessage });
        } finally {
            setDeleting(null);
        }
    }, [selectedQuizId, editingId, fetchQuestions, resetForm, toast]);

    const getQuizIcon = (quizType: string) => {
        return quizType === "tournament" ? "🏆" : "📅";
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Admin • Questions</h1>
                        <Link to="/admin" className="text-sm text-primary hover:underline">
                            ← Back to Admin
                        </Link>
                    </div>
                </div>

                {/* Quiz selector + form */}
                <div className={cardBase}>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                        <label className="space-y-1 flex-1">
                            <div className="text-sm">Select quiz</div>
                            <select
                                className={selectBase}
                                value={selectedQuizId}
                                onChange={(e) => setSelectedQuizId(e.target.value)}
                            >
                                {quizzes.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        {getQuizIcon(q.quiz_type)} Day {q.day_number} — {q.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            className={buttonSecondary}
                            onClick={resetForm}
                            type="button"
                        >
                            <Plus className="w-4 h-4 inline mr-1" />
                            New Question
                        </button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {editingId ? "Editing question" : "Create new question"}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1 sm:col-span-2">
                            <div className="text-sm">Question text *</div>
                            <textarea
                                className={`${textareaBase} min-h-[90px]`}
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder="დაწერეთ კითხვა..."
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Type</div>
                            <select
                                className={selectBase}
                                value={questionType}
                                onChange={(e) => setQuestionType(e.target.value as "multiple_choice" | "text_input")}
                            >
                                <option value="multiple_choice">multiple_choice</option>
                                <option value="text_input">text_input</option>
                            </select>
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Points</div>
                            <input
                                type="number"
                                className={inputBase}
                                value={points}
                                onChange={(e) => setPoints(Number(e.target.value))}
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Order index</div>
                            <input
                                type="number"
                                className={inputBase}
                                value={orderIndex}
                                onChange={(e) => setOrderIndex(Number(e.target.value))}
                            />
                        </label>

                        {questionType === "multiple_choice" && (
                            <label className="space-y-1 sm:col-span-2">
                                <div className="text-sm">Options (json array)</div>
                                <textarea
                                    className={`${textareaBase} font-mono text-sm min-h-[90px]`}
                                    value={optionsJson}
                                    onChange={(e) => setOptionsJson(e.target.value)}
                                    placeholder='["A","B","C","D"]'
                                />
                                {parsedOptions === "__INVALID__" && (
                                    <div className="text-xs text-destructive">Invalid JSON array</div>
                                )}
                            </label>
                        )}

                        <label className="space-y-1 sm:col-span-2">
                            <div className="text-sm">Correct answer *</div>
                            <input
                                className={inputBase}
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                                placeholder={questionType === "multiple_choice" ? "Must match one option exactly" : "Answer text"}
                            />
                        </label>
                    </div>

                    <button
                        className={buttonPrimary}
                        onClick={saveQuestion}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : editingId ? (
                            "Update Question"
                        ) : (
                            "Create Question"
                        )}
                    </button>
                </div>

                {/* List */}
                <div className={listContainer}>
                    <div className={listHeader}>Questions ({questions.length})</div>

                    {loading ? (
                        <div className="p-6 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="p-6 text-muted-foreground">No questions for this quiz yet</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {questions.map((q) => (
                                <div key={q.id} className="p-4 flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-semibold">
                                                #{q.order_index} • {q.points} pts • {q.question_type}
                                            </div>
                                            <div className="text-sm break-words">{q.question_text}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Correct: <span className="font-mono text-success">{q.correct_answer}</span>
                                            </div>
                                            {q.question_type === "multiple_choice" && q.options && (
                                                <div className="text-xs text-muted-foreground font-mono break-words">
                                                    Options: {JSON.stringify(q.options)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                className={buttonSecondary}
                                                onClick={() => startEdit(q)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                className={buttonDestructive}
                                                onClick={() => deleteQuestion(q.id)}
                                                disabled={deleting === q.id}
                                            >
                                                {deleting === q.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}