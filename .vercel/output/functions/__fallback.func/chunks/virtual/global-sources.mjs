const sources = [
    {
        "sourceType": "user",
        "fetch": "/api/sitemap/artists"
    },
    {
        "sourceType": "user",
        "fetch": "/api/sitemap/exhibitions"
    },
    {
        "sourceType": "user",
        "fetch": "/api/sitemap/window"
    },
    {
        "sourceType": "user",
        "fetch": "/api/sitemap/viewing-rooms"
    },
    {
        "sourceType": "user",
        "fetch": "/api/sitemap/publications"
    },
    {
        "sourceType": "user",
        "fetch": "/api/sitemap/news"
    },
    {
        "context": {
            "name": "sitemap:urls",
            "description": "Set with the `sitemap.urls` config."
        },
        "urls": [],
        "sourceType": "user"
    },
    {
        "context": {
            "name": "@nuxt/content@v3:urls",
            "description": "Generated from your markdown files.",
            "tips": [
                "Parsing the following collections: "
            ]
        },
        "fetch": "/__sitemap__/nuxt-content-urls.json",
        "sourceType": "app"
    },
    {
        "context": {
            "name": "nuxt:pages",
            "description": "Generated from your static page files.",
            "tips": [
                "Can be disabled with `{ excludeAppSources: ['nuxt:pages'] }`."
            ]
        },
        "urls": [
            {
                "loc": "/ham",
                "lastmod": "2025-09-08T22:04:02.504Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/ham"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/ham"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/ham"
                    }
                ]
            },
            {
                "loc": "/fa/ham",
                "lastmod": "2025-09-08T22:04:02.504Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/ham"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/ham"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/ham"
                    }
                ]
            },
            {
                "loc": "/",
                "lastmod": "2025-09-08T17:10:15.900Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/"
                    }
                ]
            },
            {
                "loc": "/fa",
                "lastmod": "2025-09-08T17:10:15.900Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/"
                    }
                ]
            },
            {
                "loc": "/vault",
                "lastmod": "2025-09-07T22:25:30.782Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/vault"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/vault"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/vault"
                    }
                ]
            },
            {
                "loc": "/fa/vault",
                "lastmod": "2025-09-07T22:25:30.782Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/vault"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/vault"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/vault"
                    }
                ]
            },
            {
                "loc": "/studio",
                "lastmod": "2025-09-07T22:42:00.696Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/studio"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/studio"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/studio"
                    }
                ]
            },
            {
                "loc": "/fa/studio",
                "lastmod": "2025-09-07T22:42:00.696Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/studio"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/studio"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/studio"
                    }
                ]
            },
            {
                "loc": "/gallery",
                "lastmod": "2025-09-07T22:25:30.781Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/gallery"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/gallery"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/gallery"
                    }
                ]
            },
            {
                "loc": "/fa/gallery",
                "lastmod": "2025-09-07T22:25:30.781Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/gallery"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/gallery"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/gallery"
                    }
                ]
            },
            {
                "loc": "/font-test",
                "lastmod": "2025-09-08T17:58:14.525Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/font-test"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/font-test"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/font-test"
                    }
                ]
            },
            {
                "loc": "/fa/font-test",
                "lastmod": "2025-09-08T17:58:14.525Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/font-test"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/font-test"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/font-test"
                    }
                ]
            },
            {
                "loc": "/news",
                "lastmod": "2025-09-07T22:50:34.996Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/news"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/news"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/news"
                    }
                ]
            },
            {
                "loc": "/fa/news",
                "lastmod": "2025-09-07T22:50:34.996Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/news"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/news"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/news"
                    }
                ]
            },
            {
                "loc": "/admin",
                "lastmod": "2025-09-07T23:48:08.665Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/admin"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/admin"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/admin"
                    }
                ]
            },
            {
                "loc": "/fa/admin",
                "lastmod": "2025-09-07T23:48:08.665Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/admin"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/admin"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/admin"
                    }
                ]
            },
            {
                "loc": "/admin/login",
                "lastmod": "2025-09-07T22:25:30.789Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/admin/login"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/admin/login"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/admin/login"
                    }
                ]
            },
            {
                "loc": "/fa/admin/login",
                "lastmod": "2025-09-07T22:25:30.789Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/admin/login"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/admin/login"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/admin/login"
                    }
                ]
            },
            {
                "loc": "/window",
                "lastmod": "2025-09-07T22:49:55.329Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/window"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/window"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/window"
                    }
                ]
            },
            {
                "loc": "/fa/window",
                "lastmod": "2025-09-07T22:49:55.329Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/window"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/window"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/window"
                    }
                ]
            },
            {
                "loc": "/artists",
                "lastmod": "2025-09-07T23:34:49.224Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/artists"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/artists"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/artists"
                    }
                ]
            },
            {
                "loc": "/fa/artists",
                "lastmod": "2025-09-07T23:34:49.224Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/artists"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/artists"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/artists"
                    }
                ]
            },
            {
                "loc": "/exhibitions",
                "lastmod": "2025-09-07T22:49:13.407Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/exhibitions"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/exhibitions"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/exhibitions"
                    }
                ]
            },
            {
                "loc": "/fa/exhibitions",
                "lastmod": "2025-09-07T22:49:13.407Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/exhibitions"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/exhibitions"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/exhibitions"
                    }
                ]
            },
            {
                "loc": "/publications",
                "lastmod": "2025-09-07T22:50:21.699Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/publications"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/publications"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/publications"
                    }
                ]
            },
            {
                "loc": "/fa/publications",
                "lastmod": "2025-09-07T22:50:21.699Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/publications"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/publications"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/publications"
                    }
                ]
            },
            {
                "loc": "/viewing-rooms",
                "lastmod": "2025-09-07T22:49:39.286Z",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/viewing-rooms"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/viewing-rooms"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/viewing-rooms"
                    }
                ]
            },
            {
                "loc": "/fa/viewing-rooms",
                "lastmod": "2025-09-07T22:49:39.286Z",
                "_sitemap": "fa-IR",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/viewing-rooms"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa/viewing-rooms"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/viewing-rooms"
                    }
                ]
            },
            {
                "loc": "/sitemap.xml",
                "lastmod": "2025-06-03T14:56:22.034Z",
                "_sitemap": "en-US"
            },
            {
                "loc": "/en/sitemap.xml",
                "lastmod": "2025-06-03T14:56:22.034Z",
                "_sitemap": "en-US"
            },
            {
                "loc": "/fa/sitemap.xml",
                "lastmod": "2025-06-03T14:56:22.034Z",
                "_sitemap": "en-US"
            }
        ],
        "sourceType": "app"
    },
    {
        "context": {
            "name": "nuxt:prerender",
            "description": "Generated at build time when prerendering.",
            "tips": [
                "Can be disabled with `{ excludeAppSources: ['nuxt:prerender'] }`."
            ]
        },
        "urls": [
            "/",
            {
                "loc": "/",
                "_sitemap": "en-US",
                "images": [
                    {
                        "loc": "https://YOUR-DOMAIN.com/_ipx/_/images/ph-hero.svg"
                    },
                    {
                        "loc": "https://YOUR-DOMAIN.com/_ipx/_/images/ph-thumb.svg"
                    }
                ],
                "alternatives": [
                    {
                        "hreflang": "fa",
                        "href": "/fa"
                    },
                    {
                        "hreflang": "fa-IR",
                        "href": "/fa"
                    }
                ]
            }
        ],
        "sourceType": "app"
    }
];

export { sources };
//# sourceMappingURL=global-sources.mjs.map
