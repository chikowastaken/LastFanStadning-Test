import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <p className="text-lg">რაღაც შეცდომა მოხდა</p>
                    <Button onClick={() => window.location.reload()}>
                        გვერდის განახლება
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}