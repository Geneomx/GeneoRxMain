@extends('legal.layout', ['pageTitle' => 'Privacy Policy'])

@section('doc-content')

<div class="doc-eyebrow">Legal</div>
<h1 class="doc-title">Privacy <em>Policy</em></h1>
<p class="doc-meta">Effective date: January 1, 2025 &nbsp;·&nbsp; Last updated: {{ date('F j, Y') }}</p>

<div class="toc">
  <div class="toc-title">Contents</div>
  <ol>
    <li><a href="#overview">Overview</a></li>
    <li><a href="#data-collected">Information we collect</a></li>
    <li><a href="#how-used">How we use your information</a></li>
    <li><a href="#sharing">Sharing and disclosure</a></li>
    <li><a href="#health-data">Health and medication data</a></li>
    <li><a href="#storage">Data storage and security</a></li>
    <li><a href="#retention">Retention and deletion</a></li>
    <li><a href="#rights">Your rights</a></li>
    <li><a href="#children">Children's privacy</a></li>
    <li><a href="#changes">Changes to this policy</a></li>
    <li><a href="#contact">Contact us</a></li>
  </ol>
</div>

<section class="doc-section" id="overview">
  <h2>1. Overview</h2>
  <p>GeneoRx ("we," "us," or "our") operates the GeneoRx website and mobile application (collectively, the "Service"). This Privacy Policy explains how we collect, use, store, and share information about you when you use our Service.</p>
  <p>We take your privacy seriously   especially because the Service involves health-related information. Please read this policy carefully. By using GeneoRx, you agree to the practices described here.</p>
  <div class="callout">
    <p><strong>Important:</strong> GeneoRx is not a Covered Entity under HIPAA and does not provide clinical services. We do not store, process, or transmit Protected Health Information (PHI) as defined under HIPAA. The information you enter is used solely to personalise your experience within the Service.</p>
  </div>
</section>

<section class="doc-section" id="data-collected">
  <h2>2. Information we collect</h2>

  <h3>Information you provide directly</h3>
  <ul>
    <li><strong>Account information:</strong> name, email address, and password (stored as a one-way hash) when you create an account.</li>
    <li><strong>Health profile:</strong> medications, supplements, dosage schedules, allergy history, and symptoms you choose to enter. This is always voluntary.</li>
    <li><strong>Communication:</strong> messages or support requests you send to us.</li>
  </ul>

  <h3>Information collected automatically</h3>
  <ul>
    <li><strong>Device information:</strong> device type, operating system version, and app version.</li>
    <li><strong>Usage data:</strong> features you interact with, screens you visit, and actions you take within the app (e.g., running an interaction check). This is logged as anonymised events.</li>
    <li><strong>Log data:</strong> IP address, timestamps, and error reports if the app crashes.</li>
    <li><strong>Push notification token:</strong> if you grant permission, we store a device token to send you medication reminders. You can revoke this permission at any time in your device settings.</li>
  </ul>

  <h3>Information we do not collect</h3>
  <ul>
    <li>We do not collect Social Security numbers, government ID numbers, or financial account numbers.</li>
    <li>We do not use advertising SDKs or sell your data to advertisers.</li>
    <li>We do not collect precise GPS location.</li>
  </ul>
</section>

<section class="doc-section" id="how-used">
  <h2>3. How we use your information</h2>
  <ul>
    <li><strong>Provide the Service:</strong> run interaction checks, surface nutrient depletion alerts, and personalise results based on the profile you build.</li>
    <li><strong>Account management:</strong> authenticate you and verify your email address.</li>
    <li><strong>Transactional email:</strong> send email verification codes, password reset links, and receipts. We never send marketing email without your explicit opt-in.</li>
    <li><strong>Push notifications:</strong> send medication reminders you have configured, or important account notices. Notification permission is opt-in.</li>
    <li><strong>Product improvement:</strong> aggregate, anonymised usage data helps us understand which features are useful and which need improvement.</li>
    <li><strong>Security and fraud prevention:</strong> monitor for unusual account activity and protect the integrity of the Service.</li>
    <li><strong>Legal compliance:</strong> meet applicable law, respond to lawful requests, and enforce our Terms of Service.</li>
  </ul>
</section>

<section class="doc-section" id="sharing">
  <h2>4. Sharing and disclosure</h2>
  <p>We do not sell your personal information. We share it only in the following limited circumstances:</p>

  <h3>Service providers</h3>
  <p>We engage trusted third-party vendors who process data on our behalf, under strict confidentiality obligations:</p>
  <ul>
    <li><strong>Resend</strong>   transactional email delivery</li>
    <li><strong>Expo / Apple Push Notification service / Firebase Cloud Messaging</strong>   push notification delivery</li>
    <li><strong>Cloud hosting providers</strong>   server infrastructure and database hosting</li>
  </ul>

  <h3>Legal requirements</h3>
  <p>We may disclose your information if required by law, court order, or governmental authority, or if we believe disclosure is necessary to prevent fraud, harm, or protect our legal rights.</p>

  <h3>Business transfers</h3>
  <p>If GeneoRx is acquired or merges with another company, your information may be transferred as part of that transaction. We will notify you before your data is subject to a materially different privacy policy.</p>

  <h3>With your consent</h3>
  <p>We share data for any other purpose only with your explicit prior consent.</p>
</section>

<section class="doc-section" id="health-data">
  <h2>5. Health and medication data</h2>
  <p>The medication profiles, symptom logs, and health notes you enter are treated with additional care:</p>
  <ul>
    <li>They are stored encrypted at rest in our database.</li>
    <li>They are used exclusively to power the features you request   we do not sell, license, or share this data with pharmaceutical companies, insurers, or employers.</li>
    <li>Our team members access this data only when necessary to resolve a support issue you have raised, and only with your knowledge.</li>
    <li>All information you enter into GeneoRx is for <strong>educational reference purposes only</strong>. It does not constitute a medical record and should not be relied upon for clinical decision-making.</li>
  </ul>
</section>

<section class="doc-section" id="storage">
  <h2>6. Data storage and security</h2>
  <p>Your data is stored on servers located in the United States. We implement industry-standard technical and organisational measures to protect it, including:</p>
  <ul>
    <li>HTTPS / TLS encryption in transit for all API and web traffic</li>
    <li>Encrypted storage at rest for sensitive fields (passwords hashed with bcrypt; health data fields encrypted)</li>
    <li>Access controls limiting who on our team can access production data</li>
    <li>Regular security reviews and dependency updates</li>
  </ul>
  <p>No system is perfectly secure. If you believe your account has been compromised, please contact <a href="mailto:security@geneorx.com">security@geneorx.com</a> immediately.</p>
</section>

<section class="doc-section" id="retention">
  <h2>7. Retention and deletion</h2>
  <p>We keep your personal information for as long as your account is active or as needed to provide the Service. Specifically:</p>
  <ul>
    <li><strong>Active accounts:</strong> data retained indefinitely while your account exists.</li>
    <li><strong>Account deletion:</strong> when you delete your account (via the app's Settings screen or by emailing us), we permanently delete your personal information and health data within 30 days.</li>
    <li><strong>Aggregated analytics:</strong> anonymised, non-identifiable event data may be retained for up to 2 years for product analysis.</li>
    <li><strong>Legal holds:</strong> we may retain data longer if required by law or to resolve an open dispute.</li>
  </ul>
</section>

<section class="doc-section" id="rights">
  <h2>8. Your rights</h2>
  <p>Depending on where you live, you may have the following rights regarding your personal information:</p>
  <ul>
    <li><strong>Access:</strong> request a copy of the data we hold about you.</li>
    <li><strong>Correction:</strong> request that we correct inaccurate or incomplete data.</li>
    <li><strong>Deletion:</strong> request that we delete your account and associated data. You can initiate this directly from the app's Settings screen or by emailing us.</li>
    <li><strong>Portability:</strong> request an export of your data in a machine-readable format.</li>
    <li><strong>Opt-out of push notifications:</strong> revoke notification permissions in your device's system settings at any time.</li>
    <li><strong>Opt-out of transactional email:</strong> note that certain emails (e.g., security alerts, email verification) cannot be disabled as they are essential to the Service.</li>
  </ul>
  <p>To exercise any of these rights, contact us at <a href="mailto:privacy@geneorx.com">privacy@geneorx.com</a>. We will respond within 30 days.</p>
</section>

<section class="doc-section" id="children">
  <h2>9. Children's privacy</h2>
  <p>GeneoRx is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.</p>
</section>

<section class="doc-section" id="changes">
  <h2>10. Changes to this policy</h2>
  <p>We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or via a prominent notice in the app at least 14 days before the change takes effect. The "Last updated" date at the top of this page always reflects the most recent revision.</p>
  <p>Continued use of the Service after the effective date constitutes acceptance of the revised policy.</p>
</section>

<section class="doc-section" id="contact">
  <h2>11. Contact us</h2>
  <p>If you have questions or concerns about this Privacy Policy or our data practices, please reach out:</p>
  <ul>
    <li><strong>Email:</strong> <a href="mailto:privacy@geneorx.com">privacy@geneorx.com</a></li>
    <li><strong>General enquiries:</strong> <a href="mailto:info@geneorx.com">info@geneorx.com</a></li>
  </ul>
  <p>We take all privacy concerns seriously and will respond within 5 business days.</p>
</section>

@endsection
