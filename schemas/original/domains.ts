// schemas/original/domains.ts
// Each entry has a URL pattern and a minimal, dense schema describing the layout fields.
// Sample links are included above each entry.
//
// Common primitives
type Url = string;
type Img = {
  id?: string;
  alt?: string;
  src: Url;
  credit?: string;
  dimensions?: string;
};
type ArtistRef = { name: string; href: Url };
type Work = {
  id: string;
  title?: string;
  year?: string;
  medium?: string;
  dimensions?: string;
  artist?: string;
  alt?: string;
  src: Url;
  credit?: string;
  availability?: string;
};

export type PageKind =
  | "homePage"
  | "artistsPage"
  | "artistPage"
  | "exhibitionsPage"
  | "exhibitionPage"
  | "viewingRoomsPage"
  | "windowPage"
  | "windowItemPage"
  | "studioPage"
  | "vaultPage"
  | "publicationsPage"
  | "publicationPage"
  | "newsPage"
  | "newsItemPage"
  | "galleryPage"
  | "informationPage";

export type Schema =
  | typeof schemas.homePage
  | typeof schemas.artistsPage
  | typeof schemas.artistPage
  | typeof schemas.exhibitionsPage
  | typeof schemas.exhibitionPage
  | typeof schemas.viewingRoomsPage
  | typeof schemas.windowPage
  | typeof schemas.windowItemPage
  | typeof schemas.studioPage
  | typeof schemas.vaultPage
  | typeof schemas.publicationsPage
  | typeof schemas.publicationPage
  | typeof schemas.newsPage
  | typeof schemas.newsItemPage
  | typeof schemas.galleryPage
  | typeof schemas.informationPage;

// --- Page Schemas (layout fields only) ---
export const schemas = {
  // Home
  // ex: https://ogallery.net/en
  homePage: {
    header: {
      hero: {
        slides: [
          {
            artist: {
              name: "text",
              href: "https://ogallery.net/en/artists/<slug>" as Url,
            },
            exhibition: {
              title: "text",
              href: "https://ogallery.net/en/exhibitions/<slug>" as Url,
            },
            dates: "text",
            image: "image",
          },
        ],
      },
    },
    body: {
      news: [
        {
          href: "https://ogallery.net/en/news/<slug>" as Url,
          title: "text",
          date: "text",
          excerpt: "html",
          artists: [
            {
              name: "text",
              href: "https://ogallery.net/en/artists/<slug>" as Url,
            },
          ],
          thumb: "image",
        },
      ],
      newsletter_cta: "https://ogallery.net/en/gallery#subscribe" as Url,
    },
  },

  // Artists (index)
  // ex: https://ogallery.net/en/artists
  artistsPage: {
    header: ["title"],
    body: {
      represented_artists: {
        groups: [
          {
            letter: "A-Z",
            items: [
              {
                name: "text",
                href: "https://ogallery.net/en/artists/<slug>" as Url,
              },
            ],
          },
        ],
      },
      exhibited_artists: {
        title: "Exhibited Artists",
        groups: [
          {
            letter: "#/A-Z",
            items: [
              {
                name: "text",
                href: "https://ogallery.net/en/artists/<slug>" as Url,
              },
            ],
          },
        ],
      },
    },
  },

  // Artist (detail)
  // ex: https://ogallery.net/en/artists/azin-zolfaghari
  artistPage: {
    header: { name: "text" },
    body: {
      tabs: ["biography", "selected_works", "installation_views"],
      bio: {
        html: "html",
        cv: "https://ogallery.net/files/<path-to-cv>.pdf" as Url,
        portfolio: "https://ogallery.net/files/<path-to-cv>.pdf" as Url,
        meta: { birth_place_year: "text", residence: "text" },
      },
      selected_works: [{ id: "text", src: "image", alt: "text" }],
      installation_views: [
        { id: "text", alt: "text", src: "image", credit: "text" },
      ],
    },
  },

  // Exhibitions (index)
  // ex: https://ogallery.net/en/exhibitions
  exhibitionsPage: {
    header: ["tabs_current_past"],
    body: {
      current: [
        {
          href: "url" as Url,
          title: "text",
          by: { type: "text", name: "text", href: "url" as Url },
          dates: "text",
          thumb: "image",
        },
      ],
      past: {
        year_nav: [{ year: "text", href: "url" as Url }],
        items: [
          {
            href: "url" as Url,
            title: "text",
            by: { type: "text", name: "text", href: "url" as Url },
            dates: "text",
            thumb: "image",
          },
        ],
      },
    },
  },

  // Exhibition (detail)
  // ex: https://ogallery.net/en/exhibitions/alleys
  exhibitionPage: {
    header: {
      title: "text",
      artists: [{ name: "text", href: "url" as Url }],
      dates: "text",
    },
    body: {
        
      press_release: "html",
      selected_works: [
        {
          id: "text",
          title: "text",
          year: "text",
          medium: "text",
          dimensions: "text",
          artist: "text",
          alt: "text",
          src: "image",
          credit: "text",
        },
      ],
      installation_views: [
        { id: "text", alt: "text", src: "image", credit: "text" },
      ],
    },
  },

  // Viewing Rooms (index)
  // ex: https://ogallery.net/en/viewing-rooms
  viewingRoomsPage: {
    header: ["tabs_past"],
    body: {
      past: {
        year_nav: [
          {
            year: "2020",
            href: "https://ogallery.net/en/viewing-rooms/2020" as Url,
          },
          {
            year: "2021",
            href: "https://ogallery.net/en/viewing-rooms/2021" as Url,
          },
          {
            year: "2022",
            href: "https://ogallery.net/en/viewing-rooms/2022" as Url,
          },
        ],
        items: [
          {
            href: "https://ogallery.net/en/viewing-rooms/<slug>" as Url,
            title: "text",
            artist: {
              name: "text",
              href: "https://ogallery.net/en/artists/<slug>" as Url,
            },
            dates: "text",
            thumb: "image",
          },
        ],
      },
    },
  },

  // The Window (index)
  // ex: https://ogallery.net/en/window
  windowPage: {
    header: ["tabs_current_past"],
    body: {
      current: [
        {
          href: "https://ogallery.net/en/window/<slug>" as Url,
          title: "text",
          dates: "text",
          thumb: "image",
        },
      ],
      past: {
        year_nav: [
          { year: "2023", href: "https://ogallery.net/en/window/2023" as Url },
          { year: "2024", href: "https://ogallery.net/en/window/2024" as Url },
          { year: "2025", href: "https://ogallery.net/en/window/2025" as Url },
        ],
        items: [
          {
            href: "https://ogallery.net/en/window/<slug>" as Url,
            title: "text",
            artist: {
              name: "text",
              href: "https://ogallery.net/en/artists/<slug>" as Url,
            },
            dates: "text",
            thumb: "image",
          },
        ],
      },
    },
  },

  // The Window (detail)
  // ex: https://ogallery.net/en/window/The-Tremor-in-the-Brightest-Day
  windowItemPage: {
    header: { title: "text", dates: "text" },
    body: {
      press_release: "html",
      artist: {
        name: "text",
        href: "https://ogallery.net/en/artists/<slug>" as Url,
      },
      selected_works: [
        {
          id: "text",
          title: "text",
          year: "text",
          medium: "text",
          dimensions: "text",
          availability: "text",
          alt: "text",
          src: "image",
          view_in_room: "boolean",
        },
      ],
    },
  },

  // Studio
  // ex: https://ogallery.net/en/studio
  studioPage: {
    header: { title: "text" },
    body: {
      about: "html",
      programs: [
        {
          title: "text",
          dates: "text",
          desc: "html",
          images: [{ id: "text", alt: "text", src: "image", credit: "text" }],
        },
      ],
      residents: {
        current: [
          {
            name: "text",
            href: "https://ogallery.net/en/artists/<slug>" as Url,
          },
        ],
        past: [
          {
            name: "text",
            href: "https://ogallery.net/en/artists/<slug>" as Url,
          },
        ],
      },
      gallery: [{ id: "text", alt: "text", src: "image", credit: "text" }],
      apply: "https://ogallery.net/en/studio#apply" as Url,
    },
  },

  // Vault
  // ex: https://ogallery.net/en/vault
  vaultPage: {
    header: { title: "text" },
    body: {
      access: { prompt: "text", password_input: true, cta: "View Work" },
      works: [
        {
          id: "text",
          artist: {
            name: "text",
            href: "https://ogallery.net/en/artists/<slug>" as Url,
          },
          title: "text",
          year: "text",
          medium: "text",
          dimensions: "text",
          price: "text",
          availability: "text",
          images: [{ id: "text", alt: "text", src: "image", credit: "text" }],
        },
      ],
    },
  },

  // Publications (index)
  // ex: https://ogallery.net/en/publications
  publicationsPage: {
    header: ["title"],
    body: {
      items: [
        {
          href: "https://ogallery.net/en/publications/<slug>" as Url,
          title: "text",
          date: "text",
          excerpt: "html",
          thumb: "https://ogallery.net/files/<path-to-image>.jpg" as Url,
        },
      ],
    },
  },

  // Publication (detail)
  // ex: https://ogallery.net/en/publications/annual-report-2023-2024
  publicationPage: {
    header: { title: "text", date: "text" },
    body: {
      lead: "html",
      cover:
        "https://ogallery.net/files/Statics/uploads/publications/Annual/featuredimage-List.jpg" as Url,
      download_pdf:
        "https://ogallery.net/files/Statics/uploads/publications/Annual/OGallery-AnnualReport-2023-2024..pdf" as Url,
      content: "html",
      images: [
        {
          id: "text",
          alt: "text",
          src: "https://ogallery.net/files/<path-to-image>.jpg" as Url,
          credit: "text",
        },
      ],
    },
  },

  // News (index)
  // ex: https://ogallery.net/en/news
  newsPage: {
    header: ["tabs_all_artist_gallery_fairs"],
    body: {
      items: [
        {
          href: "https://ogallery.net/en/news/<slug>" as Url,
          title: "text",
          date: "text",
          excerpt: "html",
          thumb: "https://ogallery.net/files/<path-to-image>.jpg" as Url,
        },
      ],
      pagination: [
        "https://ogallery.net/en/news" as Url,
        "https://ogallery.net/en/news/1" as Url,
        "https://ogallery.net/en/news/2" as Url,
        "https://ogallery.net/en/news/3" as Url,
      ],
    },
  },

  // News (detail)
  // ex: https://ogallery.net/en/news/untitled
  newsItemPage: {
    header: { title: "text", dates: "text" },
    body: {
      attending_artists: [
        { name: "text", href: "https://ogallery.net/en/artists/<slug>" as Url },
      ],
      press_release: "html",
      links: [
        {
          label: "More on <artist>",
          href: "https://ogallery.net/en/artists/<slug>" as Url,
        },
      ],
      images: [
        {
          id: "text",
          alt: "text",
          src: "https://ogallery.net/files/<path-to-image>.jpg" as Url,
          credit: "text",
        },
      ],
    },
  },

  // Gallery
  // ex: https://ogallery.net/en/gallery
  galleryPage: {
    header: { tabs: ["About", "Hours", "Map", "Contact", "Subscribe"] },
    body: {
      about: "html",
      hours: ["text"],
      map: {
        image:
          "https://ogallery.net/files/Statics/uploads/2019/12/map.png" as Url,
      },
      contact: {
        address: "text",
        phone: "text",
        email: "mailto:info@ogallery.net" as Url,
      },
      subscribe: {
        fields: [
          "first_name",
          "last_name",
          "email",
          "country",
          "organization",
          "job_title",
        ],
        action: "https://ogallery.net/en/gallery#subscribe" as Url,
      },
    },
  },

  // Information (fallback/404)
  // ex: https://ogallery.net/en/information
  informationPage: {
    header: ["status"],
    body: {
      status: "404",
      redirect_to: "https://ogallery.net/en/gallery" as Url,
    },
  },
} as const;

// --- Route patterns to select schema by URL ---
export type DomainEntry = {
  kind: PageKind;
  pattern: RegExp;
  schema: Schema;
};

// Keep absolute URL regexes to be used both on client/server (Nuxt)
export const domains: readonly DomainEntry[] = [
  // Home
  {
    kind: "homePage",
    pattern: /^https?:\/\/ogallery\.net\/en\/?$/i,
    schema: schemas.homePage,
  },

  // Artists index
  {
    kind: "artistsPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/artists\/?$/i,
    schema: schemas.artistsPage,
  },

  // Artist detail
  {
    kind: "artistPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/artists\/[^/]+\/?$/i,
    schema: schemas.artistPage,
  },

  // Exhibitions index
  {
    kind: "exhibitionsPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/exhibitions\/?$/i,
    schema: schemas.exhibitionsPage,
  },

  // Exhibition detail
  {
    kind: "exhibitionPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/exhibitions\/[^/]+\/?$/i,
    schema: schemas.exhibitionPage,
  },

  // Viewing Rooms index
  {
    kind: "viewingRoomsPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/viewing-rooms\/?$/i,
    schema: schemas.viewingRoomsPage,
  },

  // The Window index
  {
    kind: "windowPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/window\/?$/i,
    schema: schemas.windowPage,
  },

  // The Window detail
  {
    kind: "windowItemPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/window\/[^/]+\/?$/i,
    schema: schemas.windowItemPage,
  },

  // Studio
  {
    kind: "studioPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/studio\/?$/i,
    schema: schemas.studioPage,
  },

  // Vault
  {
    kind: "vaultPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/vault\/?$/i,
    schema: schemas.vaultPage,
  },

  // Publications index
  {
    kind: "publicationsPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/publications\/?$/i,
    schema: schemas.publicationsPage,
  },

  // Publication detail
  {
    kind: "publicationPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/publications\/[^/]+\/?$/i,
    schema: schemas.publicationPage,
  },

  // News index
  {
    kind: "newsPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/news\/?$/i,
    schema: schemas.newsPage,
  },

  // News detail
  {
    kind: "newsItemPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/news\/[^/]+\/?$/i,
    schema: schemas.newsItemPage,
  },

  // Gallery
  {
    kind: "galleryPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/gallery\/?$/i,
    schema: schemas.galleryPage,
  },

  // Information (fallback/404)
  {
    kind: "informationPage",
    pattern: /^https?:\/\/ogallery\.net\/en\/information\/?$/i,
    schema: schemas.informationPage,
  },
] as const;

// Helper: pick the domain/schema for a given absolute URL
export function resolveDomain(url: string): DomainEntry | null {
  for (const d of domains) if (d.pattern.test(url)) return d;
  return null;
}
