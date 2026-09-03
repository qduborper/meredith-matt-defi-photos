import type { MetadataRoute } from "next";

/**
 * Événement privé : on refuse l'indexation de tout le site.
 *
 * C'est une ceinture en plus des bretelles `<meta name="robots">` déjà posées
 * dans le layout. Attention à ce que ça ne fait PAS : un robots.txt est une
 * demande polie adressée aux moteurs, pas un contrôle d'accès. N'importe qui
 * connaissant l'adresse peut toujours ouvrir le site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
