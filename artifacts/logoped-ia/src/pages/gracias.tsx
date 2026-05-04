import React from "react";
import { useLocation } from "wouter";
import { useVerifyCheckout } from "@workspace/api-client-react";
import { getVerifyCheckoutQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, ArrowRight, AlertCircle } from "lucide-react";

export default function Gracias() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");

  const { data: verification, isLoading, isError } = useVerifyCheckout(
    { session_id: sessionId || "" },
    { 
      query: { 
        enabled: !!sessionId,
        queryKey: getVerifyCheckoutQueryKey({ session_id: sessionId || "" })
      } 
    }
  );

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <CardTitle>Enlace inválido</CardTitle>
            <CardDescription>No se encontró información de la sesión.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Verificando tu pago...</p>
      </div>
    );
  }

  if (isError || !verification || verification.status !== "completed") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <CardTitle>Error en la verificación</CardTitle>
            <CardDescription>
              No pudimos confirmar tu pago. Si crees que esto es un error, por favor contáctanos.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => setLocation("/")} data-testid="button-go-home-error">
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { enrollment } = verification;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-700">
        <Card className="border-none shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
          <CardHeader className="text-center pt-10 pb-6">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">¡Gracias, {enrollment?.name?.split(' ')[0]}!</CardTitle>
            <CardDescription className="text-lg">
              Tu inscripción se ha completado con éxito.
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-secondary/30 pt-6 pb-8 px-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Curso</span>
                <span className="font-medium text-right">Logopedia con IA</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Importe abonado</span>
                <span className="font-medium">€{enrollment?.pricePaid}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Correo de acceso</span>
                <span className="font-medium">{enrollment?.email}</span>
              </div>
              
              {enrollment?.isPresale && (
                <div className="mt-6 bg-primary/10 text-primary px-4 py-3 rounded-lg text-sm flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Has aprovechado la oferta de preventa
                </div>
              )}
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-1">📬 Revisa tu correo</p>
                <p className="text-sm text-amber-700">
                  Te hemos enviado la confirmación a <strong>{enrollment?.email}</strong>. Si no aparece en la bandeja de entrada, <strong>mira la carpeta de correo no deseado o spam</strong> y márcalo como "no es spam" para recibir futuros avisos directamente.
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = "mailto:"} // Dummy action for now
                data-testid="button-open-email"
              >
                Abrir mi correo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
