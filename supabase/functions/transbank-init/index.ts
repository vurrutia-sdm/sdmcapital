import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TRANSBANK_API_URL = "https://webpay3ginte.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions";
const COMMERCE_CODE = "597055555532";
const API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";
const RETURN_URL = Deno.env.get("PUBLIC_URL")! + "/reserva/confirmacion";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { propiedad_id, monto_clp, cliente_nombre, cliente_email, cliente_telefono } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const buy_order = "BO-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const session_id = "SID-" + crypto.randomUUID().slice(0, 8).toUpperCase();

    const { data: reserva, error } = await supabase
      .from("reservas")
      .insert({
        propiedad_id,
        monto_clp,
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        buy_order,
        session_id,
        estado: "pendiente",
      })
      .select()
      .single();

    if (error) throw error;

    const tbkRes = await fetch(TRANSBANK_API_URL, {
      method: "POST",
      headers: {
        "Tbk-Api-Key-Id": COMMERCE_CODE,
        "Tbk-Api-Key-Secret": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buy_order,
        session_id,
        amount: monto_clp,
        return_url: RETURN_URL,
      }),
    });

    const tbkData = await tbkRes.json();

    if (!tbkRes.ok) throw new Error(JSON.stringify(tbkData));

    return new Response(
      JSON.stringify({ url: tbkData.url, token: tbkData.token, reserva_id: reserva.id }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
