# Certificate PDF fonts

Place the server-side certificate fonts in this directory:

- `PlaywriteID-Regular.ttf` — dynamic certificate data values.
- `Satisfy-Regular.ttf` — static certificate text.

`CertificatePdfService` embeds these files with `pdf-lib` and `@pdf-lib/fontkit` when both files are present. If a deployment is missing the font package or files, the generator falls back to built-in PDF fonts so certificate generation does not break.
