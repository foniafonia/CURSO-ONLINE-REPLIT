import React from "react";
import { useGetCourseInfo, useCreateCheckout } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle2, BookOpen, BrainCircuit, LineChart, FileText, Scale, Sparkles, Loader2, Users } from "lucide-react";

const checkoutSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Home() {
  const { data: courseInfo, isLoading: isCourseLoading } = useGetCourseInfo();
  const createCheckout = useCreateCheckout();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  function onSubmit(data: CheckoutFormValues) {
    createCheckout.mutate(
      { data },
      {
        onSuccess: (result) => {
          if (result.url) {
            window.location.href = result.url;
          }
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-8 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Evoluciona tu práctica profesional</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
          Logopedia con IA:<br className="hidden md:block" /> Tu primer curso online
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
          Descubre cómo la inteligencia artificial puede transformar tus evaluaciones, 
          optimizar tu tiempo y mejorar los resultados de tus pacientes. Diseñado 
          específicamente para logopedas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button 
            size="lg" 
            className="w-full sm:w-auto text-lg h-14 px-8 shadow-lg shadow-primary/20 transition-transform hover:-translate-y-1"
            onClick={() => document.getElementById("inscripcion")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-scroll-enroll"
          >
            Inscribirme ahora
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Únete a {courseInfo?.totalEnrolled || "..."} profesionales</span>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="bg-secondary/30 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">¿Qué aprenderás?</h2>
            <p className="text-muted-foreground">6 módulos diseñados para integrar la IA en tu día a día</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: "Fundamentos de IA para terapeutas", desc: "Entiende cómo funcionan los modelos de lenguaje y cómo hablarles." },
              { icon: BrainCircuit, title: "Herramientas para evaluación", desc: "Acelera el análisis de transcripciones fonéticas y datos clínicos." },
              { icon: LineChart, title: "Planificación de tratamientos", desc: "Genera ejercicios personalizados y progresiones en segundos." },
              { icon: FileText, title: "Automatización de informes", desc: "Redacta informes clínicos precisos ahorrando horas de trabajo." },
              { icon: Scale, title: "Consideraciones éticas", desc: "Privacidad del paciente y uso responsable de la IA en salud." },
              { icon: Sparkles, title: "El futuro de la profesión", desc: "Tendencias tecnológicas y cómo mantenerte a la vanguardia." }
            ].map((mod, i) => (
              <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{mod.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enrollment Section */}
      <section id="inscripcion" className="py-20 px-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Inscripción</h2>
            <p className="text-muted-foreground">Asegura tu plaza hoy mismo</p>
          </div>

          {isCourseLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : courseInfo ? (
            <Card className="shadow-xl border-primary/20 overflow-hidden relative">
              {courseInfo.isPresale && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-xl shadow-sm">
                  Preventa
                </div>
              )}
              <CardHeader className="bg-secondary/50 pb-8 border-b border-border/50">
                <CardTitle className="text-2xl text-center">Acceso al curso completo</CardTitle>
                <CardDescription className="text-center pt-2">
                  ~8 horas de contenido • A tu ritmo
                </CardDescription>
                <div className="mt-6 text-center">
                  <div className="flex items-end justify-center gap-2">
                    <span className="text-5xl font-bold">€{courseInfo.currentPrice}</span>
                    {courseInfo.isPresale && (
                      <span className="text-xl text-muted-foreground line-through mb-1">€{courseInfo.regularPrice}</span>
                    )}
                  </div>
                  {courseInfo.isPresale && (
                    <div className="mt-4 inline-block bg-primary/10 text-primary px-3 py-1.5 rounded-md text-sm font-medium">
                      Quedan {courseInfo.presaleSpotsLeft} plazas a precio de preventa
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <ul className="space-y-4 mb-8">
                  {[
                    "Acceso ilimitado a los 6 módulos",
                    "Ejercicios prácticos y plantillas",
                    "Certificado de finalización",
                    "Comunidad de alumnos"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t pt-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                              <Input placeholder="María García" {...field} data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="maria@ejemplo.com" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+34 600 000 000" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg mt-4" 
                        disabled={createCheckout.isPending}
                        data-testid="button-submit-checkout"
                      >
                        {createCheckout.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        Ir a la pasarela de pago
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No se pudo cargar la información del curso.
            </div>
          )}
        </div>
      </section>
      
      <footer className="mt-auto py-8 text-center text-sm text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} Logoped-IA. Todos los derechos reservados.</p>
        <p className="mt-2">
          <a href="/admin" className="underline underline-offset-2 hover:text-foreground transition-colors" data-testid="link-admin">
            Panel de administración
          </a>
        </p>
      </footer>
    </div>
  );
}
