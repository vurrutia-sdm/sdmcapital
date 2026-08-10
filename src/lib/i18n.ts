import type { Lang } from '@/types'

const translationsRaw = {
  es: {
    nav: {
      inicio: 'Inicio',
      quienesSomos: 'Quiénes Somos',
      servicios: 'Servicios',
      propiedades: 'Propiedades',
      asociados: 'Asociados',
      blog: 'Blog',
      contacto: 'Contacto',
      consultar: 'Consultar',
    },
    hero: {
      kicker: 'Inversión inmobiliaria · Chile & Paraguay',
      line1: 'Tu socio',
      line2: 'en bienes',
      line3: 'raíces',
      sub: 'Más de 15 años conectando personas con oportunidades inmobiliarias en Chile y el extranjero. Financiamiento sin pagos adelantados.',
      stat1Label: 'Propiedades',
      stat2Label: 'Años',
      stat3Label: 'Países',
      locationBadge: 'Propiedades disponibles',
    },
    search: {
      comprar: 'Comprar',
      arrendar: 'Arrendar',
      internacional: 'Internacional',
      tipo: 'Tipo',
      ubicacion: 'Ubicación',
      precio: 'Precio',
      dormitorios: 'Dormitorios',
      tipoPh: 'Casa · Departamento · Oficina',
      ubicacionPh: 'Región · Comuna',
      precioPh: 'Rango en UF',
      dormitoriosPh: 'Cualquiera',
      buscar: 'Buscar',
    },
    sections: {
      propiedades: {
        label: 'Selección editorial',
        title: 'Oportunidades en Chile',
        sub: 'Propiedades curadas por nuestro equipo de expertos.',
        verTodas: 'Ver todas las propiedades',
      },
      // Solo queda `label`. El bloque del Inicio se rediseñó y su título,
      // cuerpo y los dos botones de servicios pasaron a `contenido_sitio`
      // —`financiamiento_titulo`, `_titulo_em`, `_body`, `_condicion`— o
      // desaparecieron.
      //
      // `body` NO se borra solo por estar muerta: decía «Gestionamos créditos
      // […] Sin pagos adelantados» y omitía la política de honorarios, que es
      // justo lo que este trabajo vino a corregir en las tres superficies. Una
      // cadena muerta con una afirmación comercial superada es una mina: el día
      // que alguien busque un texto de financiamiento la encuentra y la usa.
      financiamiento: {
        label: 'Gestión crediticia',
      },
      testimonios: {
        label: 'Experiencias',
        title: 'Palabras de nuestros clientes',
        sub: 'La satisfacción de nuestros clientes es nuestra mejor carta de presentación.',
      },
      contacto: {
        label: 'Contáctanos',
        title: 'Hablemos de tus metas',
        sub: 'Estamos en Las Condes, Santiago. Lunes a viernes, 09:00 – 18:00.',
        direccionLabel: 'Dirección',
        telefonoLabel: 'Teléfono',
        emailLabel: 'Email',
        horarioLabel: 'Horario',
        horario: 'Lunes a Viernes · 09:00 – 18:00',
        formTitle: 'Envíanos un mensaje',
        nombre: 'Nombre',
        email: 'Email',
        telefono: 'Teléfono',
        mensaje: 'Mensaje',
        nombrePh: 'Tu nombre completo',
        emailPh: 'tu@email.com',
        telefonoPh: '+56 9 ···',
        mensajePh: '¿En qué te podemos ayudar?',
        enviar: 'Enviar mensaje',
        enviando: 'Enviando...',
        exito: '¡Mensaje enviado! Te contactaremos pronto.',
        error: 'Error al enviar. Intenta de nuevo.',
      },
    },
    footer: {
      copy: '© 2025 SDM Capital · Todos los derechos reservados · Diseño HaikuFlow',
      tagline: 'Tu socio confiable en bienes raíces.',
      nav: 'Navegación',
      servicios: 'Servicios',
      contacto: 'Contacto',
    },
    prop: {
      enVenta: 'En venta',
      enArriendo: 'En arriendo',
      vendida: 'Vendida',
      reservada: 'Reservada',
      destacada: 'Destacada',
      inversion: 'Inversión',
      aConsultar: 'A consultar',
      dormitorios: 'Dorm.',
      banos: 'Baños',
      superficie: 'm²',
      verPropiedad: 'Ver propiedad',
    },
  },
  en: {
    nav: {
      inicio: 'Home',
      quienesSomos: 'About Us',
      servicios: 'Services',
      propiedades: 'Properties',
      asociados: 'Partners',
      blog: 'Blog',
      contacto: 'Contact',
      consultar: 'Inquire',
    },
    hero: {
      kicker: 'Real estate investment · Chile & Paraguay',
      line1: 'Your partner',
      line2: 'in real',
      line3: 'estate',
      sub: 'Over 15 years connecting people with real estate opportunities in Chile and abroad. Financing with no upfront payments.',
      stat1Label: 'Properties',
      stat2Label: 'Years',
      stat3Label: 'Countries',
      locationBadge: 'Properties available',
    },
    search: {
      comprar: 'Buy',
      arrendar: 'Rent',
      internacional: 'International',
      tipo: 'Type',
      ubicacion: 'Location',
      precio: 'Price',
      dormitorios: 'Bedrooms',
      tipoPh: 'House · Apartment · Office',
      ubicacionPh: 'Region · City',
      precioPh: 'UF range',
      dormitoriosPh: 'Any',
      buscar: 'Search',
    },
    sections: {
      propiedades: {
        label: 'Editorial selection',
        title: 'Opportunities in Chile',
        sub: 'Properties curated by our expert team.',
        verTodas: 'View all properties',
      },
      financiamiento: {
        label: 'Credit management',
      },
      testimonios: {
        label: 'Experiences',
        title: 'Words from our clients',
        sub: 'Client satisfaction is our best letter of recommendation.',
      },
      contacto: {
        label: 'Contact us',
        title: "Let's talk about your goals",
        sub: 'Based in Las Condes, Santiago. Monday to Friday, 09:00 – 18:00.',
        direccionLabel: 'Address',
        telefonoLabel: 'Phone',
        emailLabel: 'Email',
        horarioLabel: 'Hours',
        horario: 'Monday to Friday · 09:00 – 18:00',
        formTitle: 'Send us a message',
        nombre: 'Name',
        email: 'Email',
        telefono: 'Phone',
        mensaje: 'Message',
        nombrePh: 'Your full name',
        emailPh: 'you@email.com',
        telefonoPh: '+56 9 ···',
        mensajePh: 'How can we help you?',
        enviar: 'Send message',
        enviando: 'Sending...',
        exito: 'Message sent! We\'ll be in touch soon.',
        error: 'Error sending. Please try again.',
      },
    },
    footer: {
      copy: '© 2025 SDM Capital · All rights reserved · Design HaikuFlow',
      tagline: 'Your trusted partner in the world of real estate.',
      nav: 'Navigation',
      servicios: 'Services',
      contacto: 'Contact',
    },
    prop: {
      enVenta: 'For sale',
      enArriendo: 'For rent',
      vendida: 'Sold',
      reservada: 'Reserved',
      destacada: 'Featured',
      inversion: 'Investment',
      aConsultar: 'Price on request',
      dormitorios: 'Beds',
      banos: 'Baths',
      superficie: 'm²',
      verPropiedad: 'View property',
    },
  },
}

// El español es la fuente de verdad del tipo; el inglés se valida contra él.
export type Translations = typeof translationsRaw['es']

export const translations: Record<Lang, Translations> = translationsRaw

export type TranslationKey = keyof typeof translations
