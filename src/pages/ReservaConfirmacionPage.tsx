import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { useSearchParams, useNavigate } from "react-router-dom";

// ESTA PÁGINA ESTABA ENTERA FUERA DEL SISTEMA, y es la que ve alguien que acaba
// de pagar con tarjeta. En 35 líneas usaba `rounded-2xl` y `rounded-lg` contra
// la escala de tres radios, `shadow-lg` donde el sistema usa bordes finos,
// `#1a3c5e` —una variante de navy que no es ningún token—, `text-red-600` de la
// paleta por defecto de Tailwind, `text-2xl font-bold` fuera de la escala
// tipográfica, un <button> a mano en vez de `.btn-primary`, y dos EMOJI de 48px
// como icono de estado.
//
// Los emoji eran lo peor de los siete: el glifo lo pone la fuente del sistema
// operativo, así que cambia de forma y de color según el dispositivo; su verde
// no es el de la marca; y el lector de pantalla lee «marca de verificación
// blanca» antes del <h1> que sí dice qué pasó, porque no llevaban `aria-hidden`.

export default function ReservaConfirmacionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"cargando" | "exitosa" | "fallida">("cargando");
  const [datos, setDatos] = useState<any>(null);

  useEffect(() => {
    const token = params.get("token_ws");
    if (!token) { setEstado("fallida"); return; }

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transbank-confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_ws: token }),
    })
      .then((r) => r.json())
      .then((data) => {
        setDatos(data.datos);
        setEstado(data.exito ? "exitosa" : "fallida");
      })
      .catch(() => setEstado("fallida"));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- el token de Transbank se canjea UNA vez, al montar. `useSearchParams` devuelve un objeto nuevo en cada render, así que con `params` en el array este efecto reenviaría el mismo `token_ws` al confirmador en cada render, que es una operación de pago y no es idempotente.
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--off)]">
      {/* Sin descripcion propia a proposito: no es una pagina que se comparta. */}
      <SEO title="Confirmación de reserva" />
      <div
        className="bg-white p-10 max-w-md w-full text-center rounded-sdm-contenedor"
        style={{ border: '1px solid var(--border)' }}
      >
        {estado === "cargando" && (
          <>
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }}
            />
            <p className="text-[var(--muted)]">Verificando pago...</p>
          </>
        )}
        {estado === "exitosa" && (
          <>
            <CheckCircle2 aria-hidden="true" size={48} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: 'var(--green-dark)' }} />
            <h1 className="font-serif text-sdm-display-sm font-sdm-ligero mb-2" style={{ color: 'var(--navy-dark)' }}>¡Reserva confirmada!</h1>
            <p className="text-[var(--muted)] mb-6">Tu pago fue procesado correctamente.</p>
            {datos && (
              <div className="text-left text-sdm-sm bg-[var(--off)] p-4 mb-6 space-y-1 rounded-sdm-contenedor" style={{ border: '1px solid var(--border)' }}>
                <p><span className="font-sdm-semi">Orden:</span> {datos.buy_order}</p>
                <p><span className="font-sdm-semi">Monto:</span> ${datos.amount?.toLocaleString("es-CL")} CLP</p>
                <p><span className="font-sdm-semi">Tarjeta:</span> **** {datos.card_detail?.card_number}</p>
                <p><span className="font-sdm-semi">Código autorización:</span> {datos.authorization_code}</p>
              </div>
            )}
            <button onClick={() => navigate("/")} className="btn-primary w-full justify-center">
              Volver al inicio
            </button>
          </>
        )}
        {estado === "fallida" && (
          <>
            <XCircle aria-hidden="true" size={48} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: 'var(--error)' }} />
            <h1 className="font-serif text-sdm-display-sm font-sdm-ligero mb-2" style={{ color: 'var(--error)' }}>Pago no completado</h1>
            <p className="text-[var(--muted)] mb-6">No se pudo procesar el pago. Intenta nuevamente.</p>
            <button onClick={() => navigate(-1)} className="btn-primary w-full justify-center">
              Volver
            </button>
          </>
        )}
      </div>
    </div>
  );
}
