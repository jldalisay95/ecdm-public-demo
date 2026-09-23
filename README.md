# ECDM Public Demonstration

> **DRAFT RESEARCH PROTOTYPE — NOT FOR OFFICIAL USE**
>
> This application does not establish legal entitlement, constitute DOH approval, determine final eligibility, authorize hazard-allowance payment, or represent an official system of Mandaluyong City or any Philippine government institution.

ECDM is a static, browser-based demonstration of a hazard exposure documentation and decision-support process for public health workers. It links task records, policy-listed hazardous circumstances, unique exposure hours, evidence references, coverage status, and approval status in one explainable assessment.

## Data handling

The public demonstration has no database, sign-in, cookies, analytics, uploads, or browser-storage code. User inputs exist only in the open browser tab and are lost when the page is refreshed or closed. Do not enter real names, employee numbers, medical information, payroll records, or other personal data. Hosting providers may retain ordinary access or security logs.

## Model boundary

The application:

- calculates `Hm` as valid, unique documented exposure hours;
- calculates `Em = Hm / Wm` using institution-confirmed authorized working hours;
- applies the 50% documentary threshold;
- checks coverage, the 11-day exclusion, approvals, and data-integrity conditions;
- performs an exact salary-grade rate lookup for SG 1–31; and
- displays a conditional policy-rate estimate only after all encoded gates are met.

It does not create a hazard score, change a policy rate, infer a high/low classification, decide unresolved legal questions, or approve payment.

## Policy sources

- [Republic Act No. 7305](https://lawphil.net/statutes/repacts/ra1992/ra_7305_1992.html)
- [Revised Implementing Rules and Regulations](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/11/50646)
- [DBM–DOH Joint Circular No. 1, s. 2016](https://www.dbm.gov.ph/wp-content/uploads/Issuances/2016/Joint%20Circular/JOINT%20CIRCULAR%20No.1S.2016_DBM-DOH_%20AMENDMENT%20TO%20DBM-DOH%20JOINT%20CIRCULAR%20NO.%201%20S.%202012.pdf)
- [Cawad v. Abad, G.R. No. 207145](https://lawphil.net/judjuris/juri2015/jul2015/gr_207145_2015.html)

Policy review date: 21 August 2026. Later laws, circulars, jurisprudence, or authorized interpretations may require revision.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Verify the model logic

```bash
npm test
```

The automated checks cover the exact 50% boundary, below-threshold exposure, part-time treatment, pending approval, the 11-day exclusion, impossible hours, SG 32, coverage failure, and overlapping intervals. These are synthetic computational checks, not empirical validation.

## GitHub Pages

The included workflow publishes the repository root as a GitHub Pages site. In repository **Settings → Pages**, select **GitHub Actions** as the source if it is not already enabled.

## Institutional adaptation

An institution should inventory its existing authorized process before adapting this prototype. Any use of real employee records would require a separate privacy, cybersecurity, legal, records-management, procurement, and institutional-governance assessment. The public demonstration must remain separate from any controlled institutional implementation.

## Licensing and reuse

No open-source license has been assigned. Public visibility of the repository does not grant permission to reuse, modify, or represent the application as an official implementation. Ownership and licensing should be confirmed before institutional reuse.
