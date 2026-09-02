import { CATEGORIES, POINTS } from "../src/lib/constants";
import { prisma } from "../src/lib/prisma";

type SeedChallenge = {
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  points: number;
};

/**
 * Liste de base du cahier des charges §13. Les titres et le barème viennent
 * du document ; les descriptions sont rédigées ici (le cahier n'en fournit pas)
 * et restent librement modifiables depuis la console admin.
 */
const CHALLENGES: SeedChallenge[] = [
  // ---- Portraits & rencontres ----
  {
    title: "Un selfie avec les mariés",
    description: "Le grand classique. Attrapez Mérédith et Matthieu entre deux félicitations.",
    category: "Portraits & rencontres",
    points: POINTS.INTERMEDIAIRE,
  },
  {
    title: "Une photo avec une personne que tu ne connaissais pas avant ce soir",
    description: "Allez vers quelqu'un que vous croisez pour la première fois, et repartez avec un souvenir.",
    category: "Portraits & rencontres",
    points: POINTS.INTERMEDIAIRE,
  },
  {
    title: "Le plus beau sourire de la soirée",
    description: "Un sourire franc, celui qui illumine la pièce. À vous de le repérer.",
    category: "Portraits & rencontres",
    points: POINTS.FACILE,
  },
  {
    title: "Trois générations réunies sur une seule photo",
    description: "Grands-parents, parents et enfants dans un même cadre. Un souvenir qui traverse le temps.",
    category: "Portraits & rencontres",
    points: POINTS.CREATIF,
  },
  {
    title: "Un portrait « volé »",
    description: "La personne ne regarde pas l'objectif. Discrétion et bon timing.",
    category: "Portraits & rencontres",
    points: POINTS.INTERMEDIAIRE,
  },

  // ---- Moments & ambiance ----
  {
    title: "La piste de danse en pleine action",
    description: "Mouvement, lumières, énergie. N'ayez pas peur du flou.",
    category: "Moments & ambiance",
    points: POINTS.FACILE,
  },
  {
    title: "Un fou rire capturé sur le vif",
    description: "Le rire qui part et qui ne s'arrête plus. Déclenchez vite.",
    category: "Moments & ambiance",
    points: POINTS.INTERMEDIAIRE,
  },
  {
    title: "Le moment le plus émouvant que tu as vu",
    description: "Une larme, une accolade, un regard. Le moment qui vous a serré le cœur.",
    category: "Moments & ambiance",
    points: POINTS.INTERMEDIAIRE,
  },
  {
    title: "Le toast ou le discours en cours",
    description: "Verre levé, micro en main : immortalisez celui qui prend la parole.",
    category: "Moments & ambiance",
    points: POINTS.FACILE,
  },
  {
    title: "L'entrée des mariés",
    description: "Le moment que tout le monde attend. Préparez votre téléphone à l'avance.",
    category: "Moments & ambiance",
    points: POINTS.INTERMEDIAIRE,
  },

  // ---- Créatifs & fun ----
  {
    title: "Recrée une pose de couple culte",
    description: "Titanic, affiche de film, tableau célèbre… Recrutez un complice et osez.",
    category: "Créatifs & fun",
    points: POINTS.CREATIF,
  },
  {
    title: "Une photo en noir et blanc",
    description: "Passez en monochrome et jouez avec les contrastes de la soirée.",
    category: "Créatifs & fun",
    points: POINTS.INTERMEDIAIRE,
  },
  {
    title: "Un cliché à contre-jour au coucher du soleil",
    description: "Placez votre sujet devant la lumière du lac. Silhouettes garanties.",
    category: "Créatifs & fun",
    points: POINTS.CREATIF,
  },
  {
    title: "La tenue la plus originale de la soirée",
    description: "Une couleur, un chapeau, des chaussures improbables : la pièce qui se remarque.",
    category: "Créatifs & fun",
    points: POINTS.INTERMEDIAIRE,
  },
  {
    title: "La photo la plus stylée de ta table",
    description: "Composez, cadrez, dirigez vos voisins. La table la plus photogénique, c'est la vôtre.",
    category: "Créatifs & fun",
    points: POINTS.INTERMEDIAIRE,
  },

  // ---- Détails ----
  {
    title: "Les alliances",
    description: "Approchez-vous : la lumière sur le métal fait tout le travail.",
    category: "Détails",
    points: POINTS.FACILE,
  },
  {
    title: "La décoration de table qui te plaît le plus",
    description: "Fleurs, marque-places, bougies : le détail qui vous a fait sourire en vous asseyant.",
    category: "Détails",
    points: POINTS.FACILE,
  },
  {
    title: "Le dessert ou la pièce montée",
    description: "Avant qu'il n'en reste plus rien. Une photo, puis vous pouvez goûter.",
    category: "Détails",
    points: POINTS.FACILE,
  },
  {
    title: "Un détail du lieu qui t'a marqué",
    description: "Une vue sur le lac, une porte, une lumière. Ce que vous garderez du lieu.",
    category: "Détails",
    points: POINTS.FACILE,
  },

  // ---- Défis de groupe ----
  {
    title: "Toute ta table réunie sur une seule photo",
    description: "Personne ne manque à l'appel. Trouvez le bon recul, ou un bras assez long.",
    category: "Défis de groupe",
    points: POINTS.INTERMEDIAIRE,
  },
  {
    title: "Le maximum de personnes sur un seul selfie",
    description: "Serrez-vous. Le record de la soirée est à battre.",
    category: "Défis de groupe",
    points: POINTS.CREATIF,
  },
  {
    title: "Une photo avec un témoin",
    description: "Ils ont tout organisé dans l'ombre : offrez-leur un instant de lumière.",
    category: "Défis de groupe",
    points: POINTS.INTERMEDIAIRE,
  },
];

async function main() {
  // Idempotent : on retrouve les défis existants par titre, ce qui permet de
  // relancer le seed sans écraser les modifications faites par l'admin.
  let created = 0;
  let updatedOrder = 0;

  for (const [index, challenge] of CHALLENGES.entries()) {
    const order = (index + 1) * 10; // pas de 10 : laisse la place aux insertions
    const existing = await prisma.challenge.findFirst({ where: { title: challenge.title } });

    if (existing) {
      if (existing.order !== order) {
        await prisma.challenge.update({ where: { id: existing.id }, data: { order } });
        updatedOrder += 1;
      }
      continue;
    }

    await prisma.challenge.create({ data: { ...challenge, order } });
    created += 1;
  }

  const total = await prisma.challenge.count();
  console.log(
    `Seed terminé : ${created} défi(s) créé(s), ${updatedOrder} réordonné(s), ${total} défi(s) en base.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
