import React, { useState } from "react";
import {
  useAdminGetStats,
  useAdminGetEnrollments,
  useAdminResendEmail,
  getAdminGetStatsQueryKey,
  getAdminGetEnrollmentsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Download, Mail, Users, Euro, ShieldCheck, Check, Clock,
  ArrowLeft, Send, MessageSquare, Video, FileText, Eye, ChevronDown, ChevronUp, Phone
} from "lucide-react";

const ADMIN_PASSWORD = "logoped-ia-admin-2026";
const BASE_PATH = import.meta.env.BASE_URL ?? "/";

const TEMPLATES: { id: string; label: string; icon: React.ReactNode; subject: string; body: string }[] = [
  {
    id: "bienvenida",
    label: "Bienvenida al grupo",
    icon: <Mail className="w-4 h-4" />,
    subject: "Ya estamos en marcha — Logoped-IA",
    body: `<p>Hola, <strong>{{nombre}}</strong>.</p>
<p>Quería escribirte personalmente para darte la bienvenida al grupo que va a hacer el curso.</p>
<p>Somos un grupo reducido — y eso es exactamente lo que quería. Menos ruido, más conversación real.</p>
<p>En los próximos días te iré mandando algún material de anticipo para que llegues al 23 de junio con contexto. No es teoría — son cosas que uso cada semana en consulta.</p>
<p>Cualquier duda, responde a este correo directamente.</p>
<p>Nos vemos en directo.<br/>José</p>`,
  },
  {
    id: "anticipo1",
    label: "Calentamiento 1 — Contexto",
    icon: <FileText className="w-4 h-4" />,
    subject: "Antes del curso: lo que necesitas saber sobre IA y logopedia",
    body: `<p>Hola, <strong>{{nombre}}</strong>.</p>
<p>Antes de que empiece el curso, quiero darte algo de contexto para que llegues con las preguntas correctas.</p>
<p>La mayoría de lo que se dice sobre IA en salud es ruido de marketing. Lo que vamos a hacer juntos es diferente: partir de la clínica real, no del hype.</p>
<p>Una cosa concreta que puedes hacer ahora: escribe una tarea que hagas cada semana (un informe, una programación, una adaptación) y piensa cómo la harías si tuvieras un asistente que nunca se cansa. Eso es lo que vamos a construir juntos.</p>
<p>Nos vemos el <strong>23 de junio</strong>.<br/>José</p>`,
  },
  {
    id: "anticipo2",
    label: "Calentamiento 2 — Herramientas",
    icon: <FileText className="w-4 h-4" />,
    subject: "Las herramientas que vamos a usar (y por qué estas y no otras)",
    body: `<p>Hola, <strong>{{nombre}}</strong>.</p>
<p>En la segunda sesión vamos a ver herramientas sin código para crear materiales interactivos y videojuegos clínicos. Antes de que llegues quiero explicarte por qué las he elegido.</p>
<p>El criterio no es "lo último" ni "lo más potente". El criterio es: ¿puedo usarlo en mi consulta real, sin saber programar, y que el resultado sea digno para mis pacientes?</p>
<p>Si tienes ya alguna herramienta en mente que uses o hayas probado, tráela a la sesión. El contraste es parte de la formación.</p>
<p>Nos vemos el <strong>30 de junio</strong>.<br/>José</p>`,
  },
  {
    id: "videolink",
    label: "Enlace de videoconferencia",
    icon: <Video className="w-4 h-4" />,
    subject: "Enlace para la sesión del [FECHA] — Logoped-IA",
    body: `<p>Hola, <strong>{{nombre}}</strong>.</p>
<p>Ya tenemos todo listo para la sesión de mañana. Aquí tienes el enlace de acceso:</p>
<p style="text-align:center;margin:32px 0;">
  <a href="{{ENLACE_VIDEO}}" style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
    Entrar a la videoconferencia
  </a>
</p>
<p><strong>Detalles:</strong></p>
<ul>
  <li>Fecha: [FECHA]</li>
  <li>Hora: [HORA]</li>
  <li>Duración: 90 minutos</li>
</ul>
<p>Si tienes algún problema técnico antes de entrar, escríbeme directamente.</p>
<p>Nos vemos enseguida.<br/>José</p>`,
  },
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl">Acceso Administrativo</CardTitle>
            <CardDescription>Inicia sesión para ver el panel de control</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-admin-password"
                />
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              </div>
              <Button type="submit" className="w-full" data-testid="button-admin-login">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboardContent />;
}

function AdminDashboardContent() {
  const { toast } = useToast();
  const authHeaders = { 'x-admin-secret': ADMIN_PASSWORD };

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    request: { headers: authHeaders },
    query: { queryKey: getAdminGetStatsQueryKey() }
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useAdminGetEnrollments({
    request: { headers: authHeaders },
    query: { queryKey: getAdminGetEnrollmentsQueryKey() }
  });

  const resendEmail = useAdminResendEmail({
    request: { headers: authHeaders },
  });

  const handleResendEmail = (id: number, name: string) => {
    resendEmail.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Correo enviado", description: `Se ha reenviado el correo de confirmación a ${name}.` });
        },
        onError: () => {
          toast({ title: "Error", description: "No se pudo reenviar el correo.", variant: "destructive" });
        },
      }
    );
  };

  const handleExportCSV = () => {
    if (!enrollments || enrollments.length === 0) return;
    const headers = ["ID", "Nombre", "Email", "Teléfono", "Precio Pagado", "Preventa", "Estado", "Fecha"];
    const csvContent = [
      headers.join(","),
      ...enrollments.map(e => [
        e.id,
        `"${e.name}"`,
        `"${e.email}"`,
        `"${e.phone || ''}"`,
        e.pricePaid,
        e.isPresale ? "Si" : "No",
        e.status,
        new Date(e.createdAt).toLocaleDateString()
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `matriculas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (statsLoading || enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-secondary/20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando panel...</p>
      </div>
    );
  }

  const enrolledWithPhone = (enrollments ?? []).filter(e => e.status === "completed" && e.phone);

  return (
    <div className="min-h-screen bg-secondary/20 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <a href={BASE_PATH} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" /> Volver al inicio
            </a>
            <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
            <p className="text-muted-foreground">Gestión de alumnos e inscripciones</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2" data-testid="button-export-csv">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Alumnos</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                {stats?.totalEnrolled || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stats?.pendingCount || 0} pendientes de pago</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ingresos Totales</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Euro className="w-6 h-6 text-primary" />
                {stats?.totalRevenue || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ingresos netos generados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Alumnos Preventa</CardDescription>
              <CardTitle className="text-3xl">{stats?.presaleCount || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Quedan {stats?.presaleSpotsLeft || 0} plazas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ingresos Preventa</CardDescription>
              <CardTitle className="text-3xl">€{stats?.presaleRevenue || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">vs €{stats?.regularRevenue || 0} tarifa normal</p>
            </CardContent>
          </Card>
        </div>

        {/* Comunicaciones */}
        <BroadcastSection authHeaders={authHeaders} />

        {/* WhatsApp */}
        {enrolledWithPhone.length > 0 && (
          <WhatsAppSection enrollments={enrolledWithPhone} />
        )}

        {/* Tabla alumnos */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Alumnos inscritos</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments && enrollments.length > 0 ? (
                  enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="font-medium">{enrollment.name}</div>
                        {enrollment.isPresale ? (
                          <Badge variant="secondary" className="mt-1 text-xs px-1.5 py-0">Preventa (€{enrollment.pricePaid})</Badge>
                        ) : (
                          <span className="block text-xs text-muted-foreground mt-1">Normal (€{enrollment.pricePaid})</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{enrollment.email}</div>
                        {enrollment.phone && (
                          <a
                            href={`https://wa.me/${enrollment.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <MessageSquare className="w-3 h-3" />{enrollment.phone}
                          </a>
                        )}
                        {!enrollment.phone && <div className="text-xs text-muted-foreground">—</div>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(enrollment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {enrollment.status === "completed" ? (
                          <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-none flex w-fit items-center gap-1">
                            <Check className="w-3 h-3" /> Completado
                          </Badge>
                        ) : enrollment.status === "pending" ? (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 flex w-fit items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendiente
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex w-fit items-center gap-1">Error</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendEmail(enrollment.id, enrollment.name)}
                          disabled={enrollment.status !== "completed" || resendEmail.isPending}
                          data-testid={`button-resend-email-${enrollment.id}`}
                          className="gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          <span className="hidden sm:inline">Reenviar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No hay inscripciones todavía.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

      </div>
    </div>
  );
}

function BroadcastSection({ authHeaders }: { authHeaders: Record<string, string> }) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{ total: number; recipients: { name: string; email: string }[] } | null>(null);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const applyTemplate = (id: string) => {
    const tpl = TEMPLATES.find(t => t.id === id);
    if (!tpl) return;
    setSelectedTemplate(id);
    setSubject(tpl.subject);
    setBodyHtml(tpl.body);
    setDryRunResult(null);
    setSendResult(null);
  };

  const handleDryRun = async () => {
    if (!subject || !bodyHtml) {
      toast({ title: "Faltan datos", description: "Escribe asunto y cuerpo del email.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ subject, bodyHtml, dryRun: true }),
      });
      const data = await res.json() as { total: number; recipients: { name: string; email: string }[] };
      setDryRunResult(data);
    } catch {
      toast({ title: "Error", description: "No se pudo verificar los destinatarios.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!subject || !bodyHtml) {
      toast({ title: "Faltan datos", description: "Escribe asunto y cuerpo del email.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`¿Enviar este email a ${dryRunResult?.total ?? "todos los"} alumnos? Esta acción no se puede deshacer.`)) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ subject, bodyHtml }),
      });
      const data = await res.json() as { sent: number; failed: number; total: number };
      setSendResult(data);
      toast({
        title: data.failed === 0 ? "Envío completado" : "Envío con errores",
        description: `${data.sent} enviados, ${data.failed} fallidos de ${data.total} alumnos.`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
    } catch {
      toast({ title: "Error", description: "No se pudo completar el envío.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const previewHtml = bodyHtml
    ? `<div style="font-family:system-ui;font-size:15px;line-height:1.7;color:#1f2937;padding:24px;">${bodyHtml.replace(/\{\{nombre\}\}/gi, "María García")}</div>`
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> Comunicaciones</CardTitle>
        <CardDescription>
          Envía emails a todos los alumnos confirmados. Usa <code className="bg-secondary px-1 rounded text-xs">{"{{nombre}}"}</code> para personalizar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Plantillas */}
        <div>
          <p className="text-sm font-medium mb-2">Plantillas predefinidas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl.id)}
                className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all hover:border-primary text-sm ${selectedTemplate === tpl.id ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <span className="text-primary">{tpl.icon}</span>
                <span className="font-medium leading-tight">{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Asunto</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Asunto del correo"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Cuerpo del email (HTML)</label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showPreview ? "Ocultar vista previa" : "Vista previa"}
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <Textarea
              value={bodyHtml}
              onChange={e => setBodyHtml(e.target.value)}
              placeholder="<p>Hola, {{nombre}}.</p><p>Tu mensaje aquí...</p>"
              className="font-mono text-xs min-h-[180px]"
            />
          </div>
          {showPreview && previewHtml && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-secondary px-3 py-1.5 text-xs text-muted-foreground font-medium">Vista previa — nombre de ejemplo: María García</div>
              <div
                className="p-4"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>

        {/* Dry run resultado */}
        {dryRunResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-blue-800 mb-2">Verificación: {dryRunResult.total} destinatarios</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {dryRunResult.recipients.map(r => (
                <div key={r.email} className="text-blue-700 flex gap-2">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-blue-500">{r.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultado envío */}
        {sendResult && (
          <div className={`rounded-lg p-4 text-sm font-medium ${sendResult.failed === 0 ? "bg-green-50 border border-green-200 text-green-800" : "bg-yellow-50 border border-yellow-200 text-yellow-800"}`}>
            Enviados: {sendResult.sent} · Fallidos: {sendResult.failed} · Total: {sendResult.total}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDryRun} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Verificar destinatarios
          </Button>
          <Button onClick={handleSend} disabled={sending || !subject || !bodyHtml} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar a todos los alumnos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WhatsAppSection({ enrollments }: { enrollments: { name: string; email: string; phone?: string }[] }) {
  const [message, setMessage] = useState("Hola, te escribo desde Logoped-IA. ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-green-600" /> WhatsApp</CardTitle>
        <CardDescription>
          {enrollments.length} alumno{enrollments.length !== 1 ? "s" : ""} han proporcionado su número. Los enlaces abren WhatsApp Web directamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Mensaje de inicio (personaliza antes de cada envío)</label>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="min-h-[80px]"
            placeholder="Hola, te escribo desde Logoped-IA..."
          />
        </div>
        <div className="grid gap-2">
          {enrollments.map(e => {
            const clean = (e.phone ?? "").replace(/\D/g, "");
            const encoded = encodeURIComponent(`Hola ${e.name}, ` + message);
            const waUrl = `https://wa.me/${clean}?text=${encoded}`;
            return (
              <div key={e.email} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                <div>
                  <p className="font-medium text-sm">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.phone}</p>
                </div>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Abrir chat
                </a>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Los mensajes de WhatsApp se abren en WhatsApp Web o la app. No se envían automáticamente — tú confirmas desde tu dispositivo.
        </p>
      </CardContent>
    </Card>
  );
}
