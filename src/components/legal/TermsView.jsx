import React from 'react';
import { LegalPage } from './LegalPage';

const TERMS_MD = `
## 1. Agreement

By accessing or using AI Operator (the "Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.

The Service is operated by MulBros Media. Contact: **Arghya@fsztpartners.com**.

## 2. Eligibility

You must be 18 or older and have authority to enter into this agreement on your own behalf or on behalf of any entity you represent.

## 3. Your account

- You are responsible for actions taken under your account
- Keep your authentication credentials secure
- Notify us immediately of any unauthorized access
- One account per person; sharing credentials is not permitted

## 4. Acceptable use

You agree not to:

- Reverse-engineer, scrape, or extract data outside the Service's intended APIs
- Use the Service to violate any law or regulation
- Submit content that infringes intellectual-property rights you don't hold
- Attempt to disrupt, overload, or bypass rate limits
- Use AI features to generate harmful, deceptive, or illegal content
- Use the Service to compete with MulBros Media

## 5. Your content

You retain ownership of all content you upload (auditions, tours, releases, EPK media, royalty statements, team messages). You grant us a limited license to store, process, and display this content solely to operate the Service for you.

## 6. AI-generated output

The Service uses third-party LLMs (OpenAI, Anthropic). AI output:

- Is generated, may be inaccurate, and should be verified before relying on it
- Is not guaranteed unique — others may receive substantially similar output
- Should not be treated as legal, medical, financial, or other professional advice
- You are responsible for reviewing AI suggestions before sending emails, executing contracts, or taking other consequential actions

## 7. Integrations

When you connect a third-party service (Stripe, Plaid, DocuSign, Mux, etc.), that vendor's terms also apply. We disclaim responsibility for actions taken by you within those vendor systems.

## 8. Fees + cancellation

The Service is currently provided to the MulBros team without fee. We reserve the right to introduce paid tiers in the future with at least 30 days' notice.

## 9. Termination

We may suspend or terminate your access if you violate these Terms. You may stop using the Service and request data deletion at any time (see Privacy Policy).

## 10. Disclaimers

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

## 11. Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, MULBROS MEDIA WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR DATA, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY WILL NOT EXCEED FEES YOU PAID IN THE PRIOR 12 MONTHS (CURRENTLY $0).

## 12. Governing law

These Terms are governed by the laws of the State of California, USA. Disputes will be resolved in courts located in Los Angeles County, California.

## 13. Changes

We may update these Terms. Material changes will be posted here and emailed to active users. Continued use after a change constitutes acceptance.
`;

export const TermsView = () => (
  <LegalPage title="Terms of Service" lastUpdated="2026-06-04" markdown={TERMS_MD} />
);

export default TermsView;
