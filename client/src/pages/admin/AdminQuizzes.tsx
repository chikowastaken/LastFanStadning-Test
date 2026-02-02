import { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Lock, Unlock, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { georgiaLocalToUtcIso, utcIsoToGeorgiaLocalInput } from "@/lib/timezone";
import { inputBase, buttonPrimary, buttonSecondary, buttonDestructive, cardBase, listContainer, listHeader } from "@/lib/admin-styles";
import { adminQuizApi } from "@/lib/api/admin";
import { sanitizeTitle, sanitizeDescription } from "@/lib/sanitize";

type QuizRow = {
    id: string;
    title: string;
    description: string | null;
    day_number: number;
    start_at: string;
    end_at: string;
    is_locked: boolean;
};

export default function AdminQuizzes() {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [toggling, setToggling] = useState<string | null>(null);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dayNumber, setDayNumber] = useState<number>(1);
    const [startLocal, setStartLocal] = useState("");
    const [isLocked, setIsLocked] = useState(false);

    const computedEndLocal = useMemo(() => {
        if (!startLocal) return "";
        try {
            const utcStart = new Date(georgiaLocalToUtcIso(startLocal));
            const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);
            return utcIsoToGeorgiaLocalInput(utcEnd.toISOString());
        } catch {
            return "";
        }
    }, [startLocal]);

    const resetForm = useCallback(() => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        const maxDay = quizzes.reduce((mx, q) => Math.max(mx, q.day_number), 0);
        setDayNumber(maxDay + 1 || 1);
        setStartLocal("");
        setIsLocked(false);
    }, [quizzes]);

    const fetchQuizzes = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminQuizApi.getAll();
            setQuizzes(result.quizzes as QuizRow[]);
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
        if (!loading && !editingId) {
            const maxDay = quizzes.reduce((mx, q) => Math.max(mx, q.day_number), 0);
            setDayNumber(maxDay + 1 || 1);
        }
    }, [loading, quizzes, editingId]);

    const startEdit = useCallback((q: QuizRow) => {
        setEditingId(q.id);
        setTitle(q.title);
        setDescription(q.description ?? "");
        setDayNumber(q.day_number);
        setStartLocal(utcIsoToGeorgiaLocalInput(q.start_at));
        setIsLocked(q.is_locked);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const saveQuiz = useCallback(async () => {
        if (!title.trim()) {
            toast({ variant: "destructive", title: "შეცდომა", description: "სათაური აუცილებელია" });
            return;
        }
        if (!startLocal) {
            toast({ variant: "destructive", title: "შეცდომა", description: "დაწყების დრო აუცილებელია" });
            return;
        }

        setSaving(true);
        try {
            const start_at = georgiaLocalToUtcIso(startLocal);
            const end_at = new Date(new Date(start_at).getTime() + 24 * 60 * 60 * 1000).toISOString();

            const payload = {
                title: sanitizeTitle(title), // Sanitize title
                description: description ? sanitizeDescription(description) : undefined, // Sanitize description
                day_number: Number(dayNumber),
                start_at,
                end_at,
                is_locked: isLocked,
            };

            if (editingId) {
                await adminQuizApi.update(editingId, payload);
            } else {
                await adminQuizApi.create(payload);
            }

            await fetchQuizzes();
            resetForm();
            toast({ title: "შენახულია ✅", description: editingId ? "ქვიზი განახლდა" : "ქვიზი შეიქმნა" });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "შენახვა ვერ მოხერხდა";
            toast({ variant: "destructive", title: "შენახვა ვერ მოხერხდა", description: errorMessage });
        } finally {
            setSaving(false);
        }
    }, [title, startLocal, description, dayNumber, isLocked, editingId, fetchQuizzes, resetForm, toast]);

    const deleteQuiz = useCallback(async (id: string) => {
        if (!confirm("წაშალოთ ეს ქვიზი? დაკავშირებული კითხვები შეიძლება დაზიანდეს.")) return;

        setDeleting(id);
        try {
            await adminQuizApi.delete(id);
            await fetchQuizzes();
            if (editingId === id) resetForm();
            toast({ title: "წაიშალა", description: "ქვიზი წარმატებით წაიშალა" });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "წაშლა ვერ მოხერხდა";
            toast({ variant: "destructive", title: "წაშლა ვერ მოხერხდა", description: errorMessage });
        } finally {
            setDeleting(null);
        }
    }, [editingId, fetchQuizzes, resetForm, toast]);

    const toggleLock = useCallback(async (q: QuizRow) => {
        setToggling(q.id);
        try {
            await adminQuizApi.toggleLock(q.id, !q.is_locked);
            await fetchQuizzes();
            toast({ title: q.is_locked ? "განბლოკილია" : "დაბლოკილია" });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "უცნობი შეცდომა";
            toast({ variant: "destructive", title: "შეცდომა", description: errorMessage });
        } finally {
            setToggling(null);
        }
    }, [fetchQuizzes, toast]);

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Admin • Quizzes</h1>
                        <Link to="/admin" className="text-sm text-primary hover:underline">
                            ← Back to Admin
                        </Link>
                    </div>
                    <button className={buttonSecondary} onClick={resetForm}>
                        <Plus className="w-4 h-4 inline mr-1" />
                        New Quiz
                    </button>
                </div>

                {/* Create/Edit Form */}
                <div className={cardBase}>
                    <div className="text-sm text-muted-foreground">
                        {editingId ? "Editing quiz" : "Create new quiz"} • Times are entered in Georgia time (UTC+4)
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1">
                            <div className="text-sm">Title *</div>
                            <input
                                className={inputBase}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="29 დეკემბრის ქვიზი"
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Day number *</div>
                            <input
                                type="number"
                                className={inputBase}
                                value={dayNumber}
                                onChange={(e) => setDayNumber(Number(e.target.value))}
                            />
                        </label>

                        <label className="space-y-1 sm:col-span-2">
                            <div className="text-sm">Description</div>
                            <input
                                className={inputBase}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="დღის ქვიზი — 10 კითხვა..."
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Start at (Georgia) *</div>
                            <input
                                type="datetime-local"
                                className={`${inputBase} [color-scheme:dark]`}
                                value={startLocal}
                                onChange={(e) => setStartLocal(e.target.value)}
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">End at (auto +24h)</div>
                            <input
                                type="datetime-local"
                                className={`${inputBase} [color-scheme:dark] opacity-80`}
                                value={computedEndLocal}
                                readOnly
                            />
                        </label>

                        <label className="flex items-center gap-2 sm:col-span-2">
                            <input
                                type="checkbox"
                                checked={isLocked}
                                onChange={(e) => setIsLocked(e.target.checked)}
                                className="accent-primary"
                            />
                            <span className="text-sm">Locked</span>
                        </label>
                    </div>

                    <button
                        className={buttonPrimary}
                        onClick={saveQuiz}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : editingId ? (
                            "Update Quiz"
                        ) : (
                            "Create Quiz"
                        )}
                    </button>
                </div>

                {/* List */}
                <div className={listContainer}>
                    <div className={listHeader}>All quizzes ({quizzes.length})</div>

                    {loading ? (
                        <div className="p-6 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="p-6 text-muted-foreground">No quizzes yet</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {quizzes.map((q) => (
                                <div key={q.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            Day {q.day_number}: {q.title}
                                            {q.is_locked && <Lock className="w-4 h-4 text-warning" />}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            start: {q.start_at} • end: {q.end_at}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className={buttonSecondary}
                                            onClick={() => startEdit(q)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            className={buttonSecondary}
                                            onClick={() => toggleLock(q)}
                                            disabled={toggling === q.id}
                                        >
                                            {toggling === q.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : q.is_locked ? (
                                                <Unlock className="w-4 h-4" />
                                            ) : (
                                                <Lock className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            className={buttonDestructive}
                                            onClick={() => deleteQuiz(q.id)}
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}