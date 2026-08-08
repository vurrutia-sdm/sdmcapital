import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { useSearchParams, useNavigate } from "react-router-dom";

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
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--off)]">
      {/* Sin descripcion propia a proposito: no es una pagina que se comparta. */}
      <SEO title="Confirmación de reserva" />
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {estado === "cargando" && (
          <>
            <div className="w-12 h-12 border-4 border-[#1a3c5e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--muted)]">Verificando pago...</p>
          </>
        )}
        {estado === "exitosa" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-[#1a3c5e] mb-2">¡Reserva confirmada!</h1>
            <p className="text-[var(--muted)] mb-6">Tu pago fue procesado correctamente.</p>
            {datos && (
              <div className="text-left text-sm bg-[var(--off)] rounded-lg p-4 mb-6 space-y-1">
                <p><span className="font-semibold">Orden:</span> {datos.buy_order}</p>
                <p><span className="font-semibold">Monto:</span> ${datos.amount?.toLocaleString("es-CL")} CLP</p>
                <p><span className="font-semibold">Tarjeta:</span> **** {datos.card_detail?.card_number}</p>
                <p><span className="font-semibold">Código autorización:</span> {datos.authorization_code}</p>
              </div>
            )}
            <button onClick={() => navigate("/")} className="w-full bg-[#1a3c5e] text-white py-3 rounded-lg font-semibold">
              ← Volver al inicio
            </button>
          </>
        )}
        {estado === "fallida" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Pago no completado</h1>
            <p className="text-[var(--muted)] mb-6">No se pudo procesar el pago. Intenta nuevamente.</p>
            <button onClick={() => navigate(-1)} className="w-full bg-[#1a3c5e] text-white py-3 rounded-lg font-semibold">
              Volver
            </button>
          </>
        )}
      </div>
    </div>
  );
}
