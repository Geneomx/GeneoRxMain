@extends('legal.layout', ['pageTitle' => 'Terms of Service'])

@section('doc-content')

<div class="doc-eyebrow">Legal</div>
<h1 class="doc-title">Terms of <em>Service</em></h1>
<p class="doc-meta">Effective date: January 1, 2025 &nbsp;·&nbsp; Last updated: {{ date('F j, Y') }}</p>

<div class="toc">
  <div class="toc-title">Contents</div>
  <ol>
    <li><a href="#acceptance">Acceptance of terms</a></li>
    <li><a href="#description">Service description</a></li>
    <li><a href="#not-medical">Not medical advice</a></li>
    <li><a href="#accounts">Accounts and eligibility</a></li>
    <li><a href="#subscription">Subscription and billing</a></li>
    <li><a href="#acceptable-use">Acceptable use</a></li>
    <li><a href="#ip">Intellectual property</a></li>
    <li><a href="#user-content">Your content</a></li>
    <li><a href="#disclaimer">Disclaimers</a></li>
    <li><a href="#liability">Limitation of liability</a></li>
    <li><a href="#indemnification">Indemnification</a></li>
    <li><a href="#termination">Termination</a></li>
    <li><a href="#governing-law">Governing law</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</div>

<section class="doc-section" id="acceptance">
  <h2>1. Acceptance of terms</h2>
  <p>By accessing or using the GeneoRx website or mobile application (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.</p>
  <p>We may update these Terms at any time. We will provide at least 14 days' notice of material changes by email or in-app notification. Continued use after the effective date constitutes acceptance.</p>
</section>

<section class="doc-section" id="description">
  <h2>2. Service description</h2>
  <p>GeneoRx is a personal medication intelligence platform. It allows registered users to:</p>
  <ul>
    <li>Maintain a personal medication and supplement profile</li>
    <li>Check potential drug-drug and drug-nutrient interactions</li>
    <li>View information about nutrient depletions associated with medications</li>
    <li>Set medication reminders via push notifications</li>
    <li>Log symptoms and adherence check-ins</li>
  </ul>
  <p>GeneoRx is an <strong>educational reference tool</strong>. It does not provide diagnoses, clinical recommendations, or individualised treatment plans.</p>
</section>

<section class="doc-section" id="not-medical">
  <h2>3. Not medical advice</h2>
  <div class="callout">
    <p><strong>GeneoRx is not a medical device, does not constitute the practice of medicine, and is not a substitute for professional medical advice, diagnosis, or treatment.</strong></p>
  </div>
  <p>Always seek the advice of your physician, pharmacist, or other qualified health provider with any questions you may have regarding a medical condition, medication, or supplement. Never disregard professional medical advice or delay seeking it because of something you read on GeneoRx.</p>
  <p>In case of a medical emergency, call your local emergency number immediately. GeneoRx does not provide emergency services.</p>
  <p>Drug interaction information presented by GeneoRx is drawn from publicly available reference databases and is provided for general educational purposes. It may not be complete, current, or applicable to your specific circumstances.</p>
</section>

<section class="doc-section" id="accounts">
  <h2>4. Accounts and eligibility</h2>
  <p>To access most features of GeneoRx, you must create an account. By creating an account, you represent that:</p>
  <ul>
    <li>You are at least 13 years of age (or the minimum digital age of consent in your jurisdiction, if higher).</li>
    <li>All registration information you provide is accurate and current.</li>
    <li>You will maintain the security of your password and accept responsibility for all activity that occurs under your account.</li>
    <li>You will promptly notify us of any unauthorised use of your account at <a href="mailto:security@geneorx.com">security@geneorx.com</a>.</li>
  </ul>
  <p>We reserve the right to suspend or terminate accounts that violate these Terms or that we determine, in our sole discretion, are being used in a harmful or fraudulent manner.</p>
</section>

<section class="doc-section" id="cost">
  <h2>5. Cost</h2>
  <p>GeneoRx is free to use. All features are available at no charge to registered users.</p>
</section>

<section class="doc-section" id="acceptable-use">
  <h2>6. Acceptable use</h2>
  <p>You agree not to use the Service to:</p>
  <ul>
    <li>Violate any applicable law or regulation</li>
    <li>Upload or transmit content that is defamatory, obscene, harmful, or harassing</li>
    <li>Impersonate any person or entity or misrepresent your affiliation</li>
    <li>Attempt to gain unauthorised access to any part of the Service, other accounts, or our infrastructure</li>
    <li>Use automated scripts, bots, scrapers, or crawlers to access the Service without our written permission</li>
    <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
    <li>Use the Service to develop a competing product or service</li>
    <li>Distribute unsolicited commercial communications (spam)</li>
  </ul>
</section>

<section class="doc-section" id="ip">
  <h2>7. Intellectual property</h2>
  <p>The Service, including its content, features, design, and underlying software, is owned by GeneoRx and protected by copyright, trademark, and other intellectual property laws.</p>
  <p>We grant you a limited, non-exclusive, non-transferable licence to use the Service for your personal, non-commercial purposes. You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.</p>
  <p>The GeneoRx name, logo, and "Personal medication intelligence" tagline are trademarks of GeneoRx. All other trademarks are the property of their respective owners.</p>
</section>

<section class="doc-section" id="user-content">
  <h2>8. Your content</h2>
  <p>You retain ownership of the medication profiles, symptom logs, and other data you enter into GeneoRx ("Your Content"). By using the Service, you grant us a limited licence to store, process, and display Your Content solely as necessary to operate and improve the Service.</p>
  <p>You represent that Your Content does not infringe any third-party rights and that you have the right to grant us this licence.</p>
</section>

<section class="doc-section" id="disclaimer">
  <h2>9. Disclaimers</h2>
  <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, GENEORX DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
  <p>We do not warrant that:</p>
  <ul>
    <li>The Service will be uninterrupted, error-free, or free from viruses</li>
    <li>Results obtained through the Service will be accurate, complete, or reliable</li>
    <li>Any errors in the Service will be corrected</li>
  </ul>
  <p>Drug interaction data is sourced from publicly available databases and may not reflect the most recent clinical findings. Always consult a licensed pharmacist or physician for personalised guidance.</p>
</section>

<section class="doc-section" id="liability">
  <h2>10. Limitation of liability</h2>
  <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GENEORX AND ITS OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES   INCLUDING LOST PROFITS, DATA, HEALTH OUTCOMES, OR GOODWILL   ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.</p>
  <p>OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR USD $50, WHICHEVER IS GREATER.</p>
  <p>Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability, so the above exclusions may not apply to you.</p>
</section>

<section class="doc-section" id="indemnification">
  <h2>11. Indemnification</h2>
  <p>You agree to indemnify, defend, and hold harmless GeneoRx and its officers, directors, employees, and agents from any claims, damages, losses, costs, and expenses (including reasonable legal fees) arising from: (a) your use of the Service; (b) Your Content; (c) your violation of these Terms; or (d) your violation of any third-party rights.</p>
</section>

<section class="doc-section" id="termination">
  <h2>12. Termination</h2>
  <p>You may close your account at any time from the Settings screen in the app or by emailing <a href="mailto:info@geneorx.com">info@geneorx.com</a>. Account deletion is permanent and results in the removal of all Your Content within 30 days.</p>
  <p>We may suspend or terminate your access to the Service immediately, without prior notice, if you breach these Terms or if we are required to do so by law.</p>
  <p>Termination does not affect any accrued rights or obligations. Sections 3, 7, 9, 10, 11, and 13 survive termination.</p>
</section>

<section class="doc-section" id="governing-law">
  <h2>13. Governing law and disputes</h2>
  <p>These Terms are governed by the laws of the State of Delaware, United States, without regard to its conflict-of-law principles. Any dispute arising from these Terms or the Service shall be resolved by binding arbitration administered under the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction.</p>
  <p>You waive any right to participate in a class-action lawsuit or class-wide arbitration to the extent permitted by applicable law.</p>
</section>

<section class="doc-section" id="contact">
  <h2>14. Contact</h2>
  <p>Questions about these Terms? We are happy to clarify:</p>
  <ul>
    <li><strong>Email:</strong> <a href="mailto:legal@geneorx.com">legal@geneorx.com</a></li>
    <li><strong>General enquiries:</strong> <a href="mailto:info@geneorx.com">info@geneorx.com</a></li>
  </ul>
</section>

@endsection
