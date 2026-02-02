import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const run = async () => {
            if (authLoading) return;

            if (!user) {
                navigate("/"); // or /auth
                return;
            }

            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .eq("role", "admin")
                .maybeSingle();

            if (!error && data?.role === "admin") {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
                navigate("/dashboard");
            }

            setChecking(false);
        };

        run();
    }, [user, authLoading, navigate]);

    if (authLoading || checking) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return <>{children}</>;
}

