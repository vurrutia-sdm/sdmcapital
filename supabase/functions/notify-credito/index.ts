import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO_EMAILS       = ['contacto@sdmcapital.cl', 'rurrutia@sdmcapital.cl', 'vurrutia@sdmcapital.cl']
const FROM_EMAIL      = 'captacion@sdmcapital.cl'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ACCION_LABEL: Record<string, string> = {
  compra: 'Comprar una propiedad',
  refinanciamiento: 'Refinanciar un crédito',
}
const CONDICION_LABEL: Record<string, string> = {
  nueva: 'Nueva',
  usada: 'Usada',
}
const SITUACION_LABEL: Record<string, string> = {
  dependiente: 'Trabajador dependiente',
  independiente: 'Trabajador independiente',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: { ...corsHeaders } })
  }

  try {
    const { record } = await req.json()
    const {
      nombres, apellidos, email, telefono, rut,
      accion, tipo_propiedad, condicion_propiedad,
      valor_uf, situacion_laboral, sueldo_promedio,
    } = record

    const fila = (label: string, valor: string) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7a8a96; width: 170px; vertical-align: top;">${label}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 15px; color: #0F2535;">${valor}</td>
      </tr>`

    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1a1a1a;">
        <div style="border-left: 4px solid #3DAA6E; padding-left: 16px; margin-bottom: 24px;">
          <h1 style="font-size: 22px; font-weight: 300; margin: 0; color: #0F2535;">Nueva solicitud de crédito hipotecario</h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: #7a8a96;">SDM Capital — Financiamiento Personas</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          ${fila('Nombres', nombres)}
          ${fila('Apellidos', apellidos)}
          ${fila('Email', `<a href="mailto:${email}" style="color: #1C3D5C;">${email}</a>`)}
          ${fila('Teléfono', telefono || '—')}
          ${fila('RUT', rut)}
          ${fila('¿Qué quiere hacer?', ACCION_LABEL[accion] || accion || '—')}
          ${condicion_propiedad ? fila('Propiedad nueva o usada', CONDICION_LABEL[condicion_propiedad] || condicion_propiedad) : ''}
          ${tipo_propiedad ? fila('Tipo de propiedad', tipo_propiedad) : ''}
          ${fila('Valor de la propiedad', valor_uf ? `${valor_uf} UF` : '—')}
          ${fila('Situación laboral', SITUACION_LABEL[situacion_laboral] || situacion_laboral || '—')}
          ${fila('Sueldo líquido promedio (3 meses)', sueldo_promedio ? `$${Number(sueldo_promedio).toLocaleString('es-CL')} CLP` : '—')}
        </table>

        <a href="mailto:${email}?subject=Re: Tu solicitud de crédito hipotecario - SDM Capital&body=Hola ${nombres},"
          style="display: inline-block; background: #0F2535; color: #fff; padding: 12px 24px; text-decoration: none; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 2px;">
          Responder →
        </a>

        <p style="margin-top: 32px; font-size: 12px; color: #7a8a96; border-top: 1px solid #e8edf2; padding-top: 16px;">
          SDM Capital · Av. Apoquindo 5583, Las Condes, Santiago
        </p>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAILS,
        subject: `Nueva solicitud de crédito — ${nombres} ${apellidos}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
