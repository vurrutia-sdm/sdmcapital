import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TRANSBANK_API_URL = "https://webpay3ginte.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions";
const COMMERCE_CODE = "597055555532";
const API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";

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
    const { token_ws } = await req.json();

    const tbkRes = await fetch(`${TRANSBANK_API_URL}/${token_ws}`, {
      method: "PUT",
      headers: {
        "Tbk-Api-Key-Id": COMMERCE_CODE,
        "Tbk-Api-Key-Secret": API_KEY,
        "Content-Type": "application/json",
      },
    });

    const tbkData = await tbkRes.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const exito = tbkData.response_code === 0;

    await supabase
      .from("reservas")
      .update({
        estado: exito ? "pagada" : "fallida",
        token_ws,
        transbank_response: tbkData,
      })
      .eq("buy_order", tbkData.buy_order);

    const { data: reserva } = await supabase
      .from("reservas")
      .select("propiedad_id")
      .eq("buy_order", tbkData.buy_order)
      .single();

    if (exito && reserva) {
      await supabase
        .from("propiedades")
        .update({ estado: "reservada" })
        .eq("id", reserva.propiedad_id);
    }

    return new Response(
      JSON.stringify({ exito, datos: tbkData }),
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
