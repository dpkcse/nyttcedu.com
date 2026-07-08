# Certificate PDF Final QA Report (Bangla)

## 1. QA Summary
- Certificate PDF/QR implementation review করা হয়েছে।
- Blank template folder আছে, কিন্তু `blank-certificate.pdf` নেই; তাই actual visual alignment PDF generate/render করা যায়নি।
- `package.json`-এ `pdf-lib` এবং `qrcode` আছে, কিন্তু local `node_modules`-এ package দুইটি নেই। Registry access 403 হওয়ায় install করা যায়নি।
- SQL update additive এবং destructive statement পাওয়া যায়নি।
- Security-critical routes/queries review করা হয়েছে: admin generate route authenticated, approved-only model query ব্যবহার করছে, public verify approved-only lookup ব্যবহার করছে।

## 2. Files Checked
- `services/SystemAdmin/Certificate/CertificatePdfService.js`
- `services/SystemAdmin/Certificate/CertificateQrService.js`
- `services/SystemAdmin/Certificate/AdminCertificateService.js`
- `models/system_admin/admin_certificate.js`
- `models/certification.js`
- `services/Certification/CertificationService.js`
- `controllers/front_controller/CertificationController.js`
- `routes/system_admin/admin_certificate.js`
- `routes/front_end/certification.js`
- `views/system_admin/certificate/certificate_search_old_way.ejs`
- `views/front_view/certificate_verify_result.ejs`
- `db_sql/updates/add_certificate_generation_fields.sql`
- `package.json`

## 3. Template Status
- Expected path: `public/uploads/certificates/templates/blank-certificate.pdf`
- Folder status: exists.
- File status: missing.
- Action required: production blank certificate PDF upload করুন এই নামে: `public/uploads/certificates/templates/blank-certificate.pdf`। বিকল্পভাবে `.env`-এ `CERTIFICATE_TEMPLATE_PATH=/absolute/path/to/blank-certificate.pdf` সেট করুন।
- Missing template-এর কারণে `alignment-test-certificate.pdf` generate করা হয়নি।

## 4. Dependency Status
- `package.json` contains:
  - `pdf-lib`: `^1.17.1`
  - `qrcode`: `^1.5.4`
- `node_modules` directory আছে, কিন্তু `require('pdf-lib')` fail করেছে।
- `npm install pdf-lib qrcode --save` চালানো হয়েছে, কিন্তু registry থেকে `403 Forbidden` এসেছে।
- Deployment action required: registry access available environment-এ চালান:

```bash
npm install pdf-lib qrcode --save
```

## 5. Database Update Status
- SQL file additive `ALTER TABLE ... ADD COLUMN` only.
- `DROP TABLE`, `DELETE`, destructive `UPDATE`, existing data rewrite পাওয়া যায়নি।
- Added/used fields review:
  - `certificate_pdf_path`: generated public PDF path save হয়।
  - `qr_code_path`: generated QR public path save হয়।
  - `generated_at`: generation timestamp save হয়।
  - `generated_by`: admin user id save হয়।
  - `is_generated`: generation flag save হয়।
  - `issue_date`: PDF issue date fallback/update হিসেবে ব্যবহৃত।
  - `reg_no`: PDF field হিসেবে ব্যবহৃত।
  - `passport_no`: optional PDF field হিসেবে ব্যবহৃত।
  - `roll_no`: PDF roll field হিসেবে ব্যবহৃত।
  - `course_duration`: PDF duration field হিসেবে ব্যবহৃত।
  - `exam_month`: PDF passing/exam month field হিসেবে ব্যবহৃত।
  - `institute_name`: PDF institute field হিসেবে ব্যবহৃত।

## 6. Field Mapping Table

| PDF Field | DB Field | Fallback Field | Status |
| --------- | -------- | -------------- | ------ |
| Serial No | `serial_no` | none | OK; required and sanitized |
| Reg No | `reg_no` | `id` | OK; fallback exists but business confirmation recommended |
| Session | `session` | none | OK |
| Student Name | `s_name` | none | OK |
| Father Name | `f_name` | none | OK |
| Mother Name | `m_name` | none | OK |
| Institute Name | `institute_name` | `National Youth & Technical Training Center` | OK |
| Roll No | `roll_no` | `serial_no` | OK; fallback may be semantically weak |
| Course Name | `course_title` | none | OK |
| Duration | `course_duration` | none | OK; may print `N/A` if not populated |
| Exam Month | `exam_month` | `passing_year` | OK |
| CGPA/Result | `result` | none | OK |
| Passport No | `passport_no` | omitted when blank | OK |
| Issue Date | `issue_date` | current date | OK |

## 7. Generated Test PDF Result
- Not generated.
- Blockers:
  1. `blank-certificate.pdf` missing.
  2. `pdf-lib`/`qrcode` imports unavailable in current `node_modules`.
- Mock data insert করা হয়নি, production DB untouched রাখা হয়েছে।

## 8. Alignment Issues Found
- Actual rendering verify করা যায়নি due missing template/dependencies.
- Code review-এ Serial No left side requirement-এর সাথে central config mismatch পাওয়া গেছে; সেটি central coordinate config-এ adjust করা হয়েছে।
- Reg No এবং Session right-side placement central config-এ align করা হয়েছে।

## 9. Coordinates Adjusted
- Only central `CERTIFICATE_POSITIONS` config পরিবর্তন করা হয়েছে।
- Adjusted:
  - `serialNo`: left-side placement.
  - `regNo`: right-side placement.
  - `session`: right-side placement below Reg No.

## 10. QR Verification Test Result
- QR URL format code review: `{PUBLIC_SITE_URL or https://nyttcedu.com}/certification/verify/{SERIAL_NO}`.
- Serial is sanitized before QR/PDF file generation.
- Runtime QR open test করা যায়নি because dependencies/template missing.
- Public route approved-only lookup করে; invalid/unapproved serial safe not-found result দেয়।

## 11. Admin Flow Test Result
- Full browser/admin flow execute করা যায়নি because DB credentials/session/browser state/template/dependencies unavailable.
- Code review result:
  1. Admin route authenticated.
  2. Approved certificate only query আছে।
  3. Generated PDF/QR paths DB update payload-এ যায়।
  4. UI Generate/Regenerate/View/Download controls present.
  5. Unapproved certificates UI button disabled এবং service/model layer approved-only enforced.

## 12. Security Regression Result
- `POST /certificate/generate-pdf`: `ensureAuthenticated` protected.
- Approved-only generation: model query has `WHERE id = ? AND is_approved = 1`.
- Serial no validation/sanitization: PDF/QR service strips unsafe file characters; public service validates `/^[a-zA-Z0-9_-]{1,50}$/`.
- SQL parameterization: search by name uses `LIKE ?`; serial/id lookups use placeholders.
- Public route approved-only: DB query filters `is_approved = 1`, service also checks approval.
- File path manipulation risk: generated filenames derive from sanitized serial only; public paths are relative `/uploads/...` paths.
- Absolute server path exposure: API response returns public paths only; missing-template error includes absolute path in admin-only error flow.

## 13. Remaining Issues
1. Upload required blank template PDF at `public/uploads/certificates/templates/blank-certificate.pdf`.
2. Install missing dependencies in an environment with registry access: `npm install pdf-lib qrcode --save`.
3. After template/deps are available, generate `alignment-test-certificate.pdf` with sample-like mock/approved data and visually compare with sample.
4. Confirm whether Reg No fallback to DB `id` and Roll No fallback to `serial_no` are business-approved.
5. Consider making missing-template admin error user-friendly without exposing absolute path if non-admin users can ever see the message.

## 14. Production Deployment Checklist
- [ ] Run `db_sql/updates/add_certificate_generation_fields.sql` once on production DB.
- [ ] Upload `blank-certificate.pdf` to `public/uploads/certificates/templates/` or set `CERTIFICATE_TEMPLATE_PATH`.
- [ ] Ensure `public/uploads/certificates/generated` is writable by the Node.js process.
- [ ] Ensure `public/uploads/certificates/qr` is writable by the Node.js process.
- [ ] Run `npm install pdf-lib qrcode --save` where registry access is available.
- [ ] Set `PUBLIC_SITE_URL=https://nyttcedu.com` in production env.
- [ ] Generate one approved certificate PDF and verify visual alignment.
- [ ] Scan generated QR and confirm it opens the public verification URL.
- [ ] Confirm invalid/unapproved serials show safe not-found responses.
- [ ] Confirm View/Download links serve only public relative paths.
