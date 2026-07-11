# Certificate PDF fonts

Place only these server-side certificate fonts in this directory:

- `Quintessential-Regular.ttf` — dynamic certificate database values.
- `UnifrakturMaguntia-Regular.ttf` — static certificate labels and fixed text.

`CertificatePdfService` embeds these Google Fonts with `pdf-lib` and `@pdf-lib/fontkit` when both files are present. This keeps the browser-style design and generated PDF visually aligned without depending on remote font loading, which `pdf-lib` cannot do during PDF drawing. If a deployment is missing the font package or files, generation falls back to built-in PDF fonts so approved certificate workflows do not fail.
