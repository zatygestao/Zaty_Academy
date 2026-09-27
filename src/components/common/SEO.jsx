import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente unificado de Otimização para Motores de Busca (SEO),
 * Meta Tags Open Graph, Tags Canónicas e Dados Estruturados Schema.org (JSON-LD).
 */
export default function SEO({
  title,
  description,
  image = '/og-image.png',
  type = 'website',
  schema = null
}) {
  const location = useLocation();
  const siteUrl = 'https://zatyacademy.co.mz';
  const fullUrl = `${siteUrl}${location.pathname}`;
  const defaultTitle = 'ZATY ACADEMY — Centro de Formação em Informática e Tecnologia';
  const finalTitle = title ? `${title} | ZATY ACADEMY` : defaultTitle;
  const defaultDesc = 'Centro de Formação Profissional em Informática e Tecnologia em Namicopo, Nampula. Cursos práticos de alta qualificação com foco no mercado de trabalho e certificados com QR Code.';
  const finalDesc = description || defaultDesc;
  const finalImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  useEffect(() => {
    // 1. Título do Documento
    document.title = finalTitle;

    // Helper para atualizar ou criar meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 2. Metadados Gerais
    setMetaTag('name', 'description', finalDesc);

    // 3. Open Graph (Facebook, WhatsApp, LinkedIn)
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDesc);
    setMetaTag('property', 'og:url', fullUrl);
    setMetaTag('property', 'og:image', finalImage);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'Zaty Academy');
    setMetaTag('property', 'og:locale', 'pt_MZ');

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDesc);
    setMetaTag('name', 'twitter:image', finalImage);

    // 5. Link Canónico
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // 6. Dados Estruturados Schema.org JSON-LD
    const baseOrganizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      'name': 'ZATY ACADEMY',
      'alternateName': 'Centro de Formação em Informática e Tecnologia Zaty Academy',
      'url': siteUrl,
      'logo': `${siteUrl}/logo.png`,
      'description': finalDesc,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Namicopo (Próximo à 3ª Esquadra)',
        'addressLocality': 'Nampula',
        'addressRegion': 'Nampula',
        'addressCountry': 'MZ'
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+258834847306',
        'contactType': 'customer support',
        'areaServed': 'MZ',
        'availableLanguage': ['Portuguese']
      }
    };

    const finalSchema = schema || baseOrganizationSchema;
    let schemaScript = document.getElementById('zaty-schema-jsonld');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'zaty-schema-jsonld';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(finalSchema);

    return () => {
      // Cleanup de título se desmontar
      document.title = defaultTitle;
    };
  }, [finalTitle, finalDesc, fullUrl, finalImage, type, schema]);

  return null;
}
