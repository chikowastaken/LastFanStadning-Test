import { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Lock, Unlock, Trash2, Calendar, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { georgiaLocalToUtcIso, utcIsoToGeorgiaLocalInput, getNextSaturdayDefaults } from "@/lib/timezone";
import { inputBase, buttonPrimary, buttonSecondary, buttonDestructive, cardBase, listContainer, listHeader } from "@/lib/admin-styles";
import { adminTournamentApi } from "@/lib/api/admin";
import { sanitizeTitle, sanitizeDescription } from "@/lib/sanitize";

type TournamentRow = {
    id: string;
    title: string;
    description: string | null;
    day_number: number;
    is_locked: boolean;
    quiz_type: "tournament";
    tournament_prize_gel: number | null;
    registration_opens_at: string | null;
    registration_closes_at: string | null;
    tournament_starts_at: string | null;
    tournament_ends_at: string | null;
    start_at: string;
    end_at: string;
    results_released: boolean;
};

export default function AdminTournaments() {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [toggling, setToggling] = useState<string | null>(null);
    const [togglingResults, setTogglingResults] = useState<string | null>(null);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dayNumber, setDayNumber] = useState<number>(1);
    const [isLocked, setIsLocked] = useState(false);
    const [prizeGel, setPrizeGel] = useState<number>(50);

    // Georgia local inputs
    const [regOpenLocal, setRegOpenLocal] = useState("");
    const [regCloseLocal, setRegCloseLocal] = useState("");
    const [startLocal, setStartLocal] = useState("");
    const [endLocal, setEndLocal] = useState("");

    const resetForm = useCallback(() => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        const maxDay = tournaments.reduce((mx, t) => Math.max(mx, t.day_number), 0);
        setDayNumber(maxDay + 1 || 1);
        setIsLocked(false);
        setPrizeGel(50);
        setRegOpenLocal("");
        setRegCloseLocal("");
        setStartLocal("");
        setEndLocal("");
    }, [tournaments]);

    const fetchTournaments = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminTournamentApi.getAll();
            setTournaments(result.tournaments as TournamentRow[]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "უცნობი შეცდომა";
            toast({ variant: "destructive", title: "შეცდომა", description: errorMessage });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    useEffect(() => {
        if (!loading && !editingId) {
            const maxDay = tournaments.reduce((mx, t) => Math.max(mx, t.day_number), 0);
            setDayNumber(maxDay + 1 || 1);
        }
    }, [loading, tournaments, editingId]);

    const startEdit = useCallback((t: TournamentRow) => {
        setEditingId(t.id);
        setTitle(t.title);
        setDescription(t.description ?? "");
        setDayNumber(t.day_number);
        setIsLocked(t.is_locked);
        setPrizeGel(t.tournament_prize_gel ?? 50);

        setRegOpenLocal(t.registration_opens_at ? utcIsoToGeorgiaLocalInput(t.registration_opens_at) : "");
        setRegCloseLocal(t.registration_closes_at ? utcIsoToGeorgiaLocalInput(t.registration_closes_at) : "");
        setStartLocal(t.tournament_starts_at ? utcIsoToGeorgiaLocalInput(t.tournament_starts_at) : utcIsoToGeorgiaLocalInput(t.start_at));
        setEndLocal(t.tournament_ends_at ? utcIsoToGeorgiaLocalInput(t.tournament_ends_at) : utcIsoToGeorgiaLocalInput(t.end_at));

        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const suggestedEndLocal = useMemo(() => {
        if (!startLocal) return "";
        try {
            const startUtc = new Date(georgiaLocalToUtcIso(startLocal));
            const endUtc = new Date(startUtc.getTime() + 30 * 60 * 1000); // +30 mins
            return utcIsoToGeorgiaLocalInput(endUtc.toISOString());
        } catch {
            return "";
        }
    }, [startLocal]);

    const fillSaturdayDefaults = useCallback(() => {
        const defaults = getNextSaturdayDefaults();
        setRegOpenLocal(defaults.regOpen);
        setRegCloseLocal(defaults.regClose);
        setStartLocal(defaults.start);
        setEndLocal(defaults.end);
        toast({ title: "შევსებულია", description: "შემდეგი შაბათის დროები შევსდა" });
    }, [toast]);

    const validateTimes = useCallback((): string | null => {
        if (!regOpenLocal || !regCloseLocal || !startLocal || !endLocal) {
            return "ყველა დროის ველი აუცილებელია (რეგისტრაცია + დაწყება/დასრულება).";
        }

        const regOpen = new Date(georgiaLocalToUtcIso(regOpenLocal)).getTime();
        const regClose = new Date(georgiaLocalToUtcIso(regCloseLocal)).getTime();
        const start = new Date(georgiaLocalToUtcIso(startLocal)).getTime();
        const end = new Date(georgiaLocalToUtcIso(endLocal)).getTime();

        if (!(regOpen < regClose)) return "რეგისტრაციის გახსნა უნდა იყოს დახურვამდე.";
        if (!(regClose <= start)) return "რეგისტრაციის დახურვა უნდა იყოს ტურნირის დაწყებამდე.";
        if (!(start < end)) return "ტურნირის დაწყება უნდა იყოს დასრულებამდე.";

        return null;
    }, [regOpenLocal, regCloseLocal, startLocal, endLocal]);

    const saveTournament = useCallback(async () => {
        if (!title.trim()) {
            toast({ variant: "destructive", title: "შეცდომა", description: "სათაური აუცილებელია" });
            return;
        }

        const timeError = validateTimes();
        if (timeError) {
            toast({ variant: "destructive", title: "შეცდომა", description: timeError });
            return;
        }

        setSaving(true);
        try {
            const registration_opens_at = georgiaLocalToUtcIso(regOpenLocal);
            const registration_closes_at = georgiaLocalToUtcIso(regCloseLocal);
            const tournament_starts_at = georgiaLocalToUtcIso(startLocal);
            const tournament_ends_at = georgiaLocalToUtcIso(endLocal);

            const payload = {
                title: sanitizeTitle(title), // Sanitize title
                description: description ? sanitizeDescription(description) : undefined, // Sanitize description
                day_number: Number(dayNumber), // Required field
                tournament_prize_gel: prizeGel || undefined,
                registration_opens_at,
                registration_closes_at,
                tournament_starts_at,
                tournament_ends_at,
            };

            if (editingId) {
                await adminTournamentApi.update(editingId, payload);
            } else {
                await adminTournamentApi.create(payload);
            }

            await fetchTournaments();
            resetForm();
            toast({ title: "შენახულია ✅", description: editingId ? "ტურნირი განახლდა" : "ტურნირი შეიქმნა" });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "შენახვა ვერ მოხერხდა";
            toast({ variant: "destructive", title: "შენახვა ვერ მოხერხდა", description: errorMessage });
        } finally {
            setSaving(false);
        }
    }, [title, description, dayNumber, prizeGel, regOpenLocal, regCloseLocal, startLocal, endLocal, editingId, validateTimes, fetchTournaments, resetForm, toast]);

    const deleteTournament = useCallback(async (id: string) => {
        if (!confirm("წაშალოთ ეს ტურნირი?")) return;

        setDeleting(id);
        try {
            await adminTournamentApi.delete(id);
            await fetchTournaments();
            if (editingId === id) resetForm();
            toast({ title: "წაიშალა", description: "ტურნირი წარმატებით წაიშალა" });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "წაშლა ვერ მოხერხდა";
            toast({ variant: "destructive", title: "წაშლა ვერ მოხერხდა", description: errorMessage });
        } finally {
            setDeleting(null);
        }
    }, [editingId, fetchTournaments, resetForm, toast]);

    // Note: Lock toggle not available in tournament API - tournaments don't use is_locked
    // This function is kept for compatibility but does nothing
    const toggleLock = useCallback(async (t: TournamentRow) => {
        toast({ title: "Info", description: "Tournaments don't use lock status" });
    }, [toast]);

    const toggleResultsReleased = useCallback(async (t: TournamentRow) => {
        setTogglingResults(t.id);
        try {
            await adminTournamentApi.toggleResultsReleased(t.id, !t.results_released);
            await fetchTournaments();
            toast({
                title: t.results_released ? "შედეგები დამალულია" : "შედეგები გამოქვეყნდა",
                description: t.results_released
                    ? "მოთამაშეები ვეღარ ხედავენ ლიდერბორდს"
                    : "მოთამაშეებს შეუძლიათ ნახონ შედეგები"
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "შეცდომა";
            toast({ variant: "destructive", title: "შეცდომა", description: errorMessage });
        } finally {
            setTogglingResults(null);
        }
    }, [fetchTournaments, toast]);

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Admin • Tournaments</h1>
                        <Link to="/admin" className="text-sm text-primary hover:underline">
                            ← Back to Admin
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        <button className={buttonSecondary} onClick={fillSaturdayDefaults}>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Fill Saturday
                        </button>
                        <button className={buttonSecondary} onClick={resetForm}>
                            <Plus className="w-4 h-4 inline mr-1" />
                            New Tournament
                        </button>
                    </div>
                </div>

                {/* Create/Edit Form */}
                <div className={cardBase}>
                    <div className="text-sm text-muted-foreground">
                        {editingId ? "Editing tournament" : "Create new tournament"} • Times are entered in Georgia time (UTC+4)
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1">
                            <div className="text-sm">Title *</div>
                            <input
                                className={inputBase}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="შაბათის ტურნირი — 50₾"
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Prize (GEL)</div>
                            <input
                                type="number"
                                className={inputBase}
                                value={prizeGel}
                                onChange={(e) => setPrizeGel(Number(e.target.value))}
                                min={0}
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

                        <label className="space-y-1">
                            <div className="text-sm">Description</div>
                            <input
                                className={inputBase}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="რეგისტრაცია 20:30–20:55 • სტარტი 21:00 • 50₾ პრიზი"
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Registration opens (Georgia) *</div>
                            <input
                                type="datetime-local"
                                className={`${inputBase} [color-scheme:dark]`}
                                value={regOpenLocal}
                                onChange={(e) => setRegOpenLocal(e.target.value)}
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Registration closes (Georgia) *</div>
                            <input
                                type="datetime-local"
                                className={`${inputBase} [color-scheme:dark]`}
                                value={regCloseLocal}
                                onChange={(e) => setRegCloseLocal(e.target.value)}
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Tournament starts (Georgia) *</div>
                            <input
                                type="datetime-local"
                                className={`${inputBase} [color-scheme:dark]`}
                                value={startLocal}
                                onChange={(e) => setStartLocal(e.target.value)}
                            />
                        </label>

                        <label className="space-y-1">
                            <div className="text-sm">Tournament ends (Georgia) *</div>
                            <input
                                type="datetime-local"
                                className={`${inputBase} [color-scheme:dark]`}
                                value={endLocal}
                                onChange={(e) => setEndLocal(e.target.value)}
                                placeholder={suggestedEndLocal ? `Suggested: ${suggestedEndLocal}` : ""}
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
                        onClick={saveTournament}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : editingId ? (
                            "Update Tournament"
                        ) : (
                            "Create Tournament"
                        )}
                    </button>
                </div>

                {/* List */}
                <div className={listContainer}>
                    <div className={listHeader}>All tournaments ({tournaments.length})</div>

                    {loading ? (
                        <div className="p-6 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : tournaments.length === 0 ? (
                        <div className="p-6 text-muted-foreground">No tournaments yet</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {tournaments.map((t) => (
                                <div
                                    key={t.id}
                                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div>
                                        <div className="font-semibold flex items-center gap-2 flex-wrap">
                                            🏆 {t.title}
                                            {t.is_locked && <Lock className="w-4 h-4 text-warning" />}
                                            {t.tournament_prize_gel != null && (
                                                <span className="text-sm font-normal text-muted-foreground">
                                                    • {t.tournament_prize_gel}₾
                                                </span>
                                            )}
                                            {t.results_released && (
                                                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">
                                                    შედეგები გამოქვეყნებულია
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            reg_open: {t.registration_opens_at ?? "-"} • reg_close: {t.registration_closes_at ?? "-"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            start: {t.tournament_starts_at ?? "-"} • end: {t.tournament_ends_at ?? "-"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">day_number: {t.day_number}</div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className={buttonSecondary}
                                            onClick={() => startEdit(t)}
                                            title="რედაქტირება"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            className={t.results_released ? buttonPrimary : buttonSecondary}
                                            onClick={() => toggleResultsReleased(t)}
                                            disabled={togglingResults === t.id}
                                            title={t.results_released ? "შედეგების დამალვა" : "შედეგების გამოქვეყნება"}
                                        >
                                            {togglingResults === t.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : t.results_released ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            className={buttonSecondary}
                                            onClick={() => toggleLock(t)}
                                            disabled={toggling === t.id}
                                            title="ჩაკეტვა"
                                        >
                                            {toggling === t.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : t.is_locked ? (
                                                <Unlock className="w-4 h-4" />
                                            ) : (
                                                <Lock className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            className={buttonDestructive}
                                            onClick={() => deleteTournament(t.id)}
                                            disabled={deleting === t.id}
                                            title="წაშლა"
                                        >
                                            {deleting === t.id ? (
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