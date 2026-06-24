import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO_EMAIL       = 'contacto@sdmcapital.cl'
const FROM_EMAIL     = 'notificaciones@sdmcapital.cl'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: { ...corsHeaders },
    })
  }

  try {
    const { record } = await req.json()

    const { nombre, email, telefono, tipo_propiedad, comuna, precio_uf, mensaje } = record

    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1a1a1a;">
        <div style="border-left: 4px solid #3DAA6E; padding-left: 16px; margin-bottom: 24px;">
          <h1 style="font-size: 22px; font-weight: 300; margin: 0; color: #0F2535;">Nueva propiedad para vender</h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: #7a8a96;">SDM Capital — Vende con Nosotros</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7a8a96; width: 140px;">Nombre</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 15px; color: #0F2535;">${nombre}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7a8a96;">Email</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 15px;"><a href="mailto:${email}" style="color: #1C3D5C;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7a8a96;">Teléfono</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 15px;">${telefono || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7a8a96;">Tipo de propiedad</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 15px;">${tipo_propiedad || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7a8a96;">Comuna</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 15px;">${comuna || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7a8a96;">Precio estimado</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 15px;">${precio_uf ? `${precio_uf} UF` : '—'}</td>
          </tr>
        </table>

        <div style="background: #EDF4F9; border-radius: 4px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7a8a96; margin-bottom: 10px;">Mensaje</div>
          <p style="font-size: 15px; line-height: 1.8; color: #1a1a1a; margin: 0;">${mensaje || '—'}</p>
        </div>

        <a href="mailto:${email}?subject=Re: Tu propiedad en SDM Capital&body=Hola ${nombre},"
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
        to:   TO_EMAIL,
        subject: `Nueva propiedad para vender de ${nombre} — SDM Capital`,
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
