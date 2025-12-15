/**
 * Agreement Templates Configuration
 *
 * This file contains the NDA and MSA templates with placeholders that will be
 * replaced with actual user data when agreements are accepted.
 *
 * Placeholders:
 * - {{USER_NAME}} - User's full name (firstName + lastName)
 * - {{USER_EMAIL}} - User's email address
 * - {{USER_PHONE}} - User's phone number
 * - {{EFFECTIVE_DATE}} - Date of acceptance (DD/MM/YYYY format)
 * - {{ACCEPTANCE_DATE}} - Date of acceptance (DD/MM/YYYY format)
 * - {{TIMESTAMP}} - Full timestamp (December 15, 2025 at 2:30 PM IST)
 */

export const NDA_TEMPLATE = `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    ul, ol {
      margin-bottom: 12px;
      padding-left: 40px;
    }
    li {
      margin-bottom: 8px;
    }
    .signature-block {
      margin-top: 40px;
      display: table;
      width: 100%;
    }
    .signature-column {
      display: table-cell;
      width: 48%;
      vertical-align: top;
      padding: 10px;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 60px;
      padding-top: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 10pt;
      color: #666;
    }
  </style>
</head>
<body>

<h1>NON-DISCLOSURE AGREEMENT</h1>

<p><strong>Effective Date:</strong> {{EFFECTIVE_DATE}}</p>

<h2>INTRODUCTION</h2>
<p>This Non-Disclosure Agreement (the "Agreement") is made and entered into as of the date in the signature block below between REBOO8 (the "Company") and the individual identified in the signature block below ("You" or "User").</p>

<h2>RECITALS</h2>
<p>WHEREAS, You have or will be providing services on behalf of the Company as an authorized user of the Company's Platform under the terms of a Statement of Work executed by and between Reboo8 and the Company.</p>

<p>WHEREAS, the Company and You (collectively referred to as the "Parties" and individually referred to as a "Party") desire to establish terms governing the use and protection of Confidential Information (as defined in Section 1 below) you may receive as part of such services.</p>

<p>NOW THEREFORE, in consideration of the foregoing and the mutual promises and covenants set forth herein, and other good and valuable consideration, the adequacy of which is hereby acknowledged, the Parties agree as follows:</p>

<h2>1. DEFINITIONS</h2>

<h3>1.1 Confidential Information</h3>
<p>"Confidential Information" means all information, materials, documentation and data furnished or disclosed to You by or on behalf of the Company, Reboo8 or any client that receives customer care services through the Reboo8 Platform (each a "Client"), whether in oral, written, graphic or machine-readable form, including but not limited to:</p>
<ul>
  <li>Client Information</li>
  <li>Personal Data</li>
  <li>Intellectual property</li>
  <li>Marketing plans</li>
  <li>Login and password codes</li>
  <li>Designs, procedures, and processes</li>
  <li>Business plans</li>
  <li>Contacts and other business and technical information</li>
</ul>

<h3>1.2 Client Information</h3>
<p>"Client Information" means any and all information provided by or on behalf of a Client, or a customer of a Client, to You either prior to or during the term of this Agreement, or which is otherwise deduced, provided or developed by You therefrom, in whatever form.</p>

<h3>1.3 Personal Data</h3>
<p>"Personal Data" means any information that relates to or describes an individual or household, including any data that is linked or linkable to an individual or household that You receive, access, process, store, or transmit through the Reboo8 Platform or otherwise for or on behalf of the Company, Reboo8 or any Client, including but not limited to:</p>
<ul>
  <li>Bank account numbers</li>
  <li>Social security numbers</li>
  <li>Credit or debit card numbers and related data</li>
  <li>Driver's license numbers or other government-issued identification numbers</li>
  <li>Personal Identification Numbers (PINs)</li>
  <li>Mother's maiden name</li>
  <li>Biometric or health data</li>
  <li>Answers to security questions</li>
  <li>Any other information that could allow access to financial accounts or facilitate identity theft</li>
</ul>
<p>All Personal Data is Confidential Information.</p>

<h2>2. CONFIDENTIALITY OBLIGATIONS</h2>
<p>During the term of this Agreement, and indefinitely thereafter, You agree to maintain all Confidential Information in confidence, and will not, except as otherwise permitted and expressly directed in writing by the disclosing Party, use, copy, or disclose or permit any unauthorized person access to, any such Confidential Information.</p>

<h2>3. PERMITTED USE</h2>
<p>You will use the Confidential Information received or otherwise obtained for the sole purpose of providing services for the Company on the Reboo8 Platform or otherwise. You will not use such Confidential Information for any other personal or commercial purpose or otherwise in any manner detrimental to the Company, Reboo8 or any Client.</p>

<p>You acknowledge and agree that Personal Data entered into the data system of a Client will only be entered to process a transaction that has been expressly authorized by the individual to whom it relates.</p>

<p>You will not:</p>
<ul>
  <li>Write down, screen scrape, or screen capture any Confidential Information</li>
  <li>Print or save Confidential Information to local media devices</li>
  <li>Save any Confidential Information to another storage method that may place such Confidential Information in a position to be shared, given, or used for fraudulent or unauthorized purposes</li>
  <li>Otherwise violate this Agreement in any manner</li>
</ul>

<h2>4. EXCEPTIONS TO CONFIDENTIALITY</h2>
<p>The restrictions of this Agreement on use and disclosure of Confidential Information will not apply to information that:</p>
<ol type="a">
  <li>Was publicly available at the time it was received by You; or</li>
  <li>Becomes publicly available subsequent to the time received by You other than through, or as a result of, your actions or inactions</li>
</ol>
<p>Provided, however, the exceptions in (a) and (b) above do not apply to Personal Data.</p>

<h2>5. LEGAL DISCLOSURE</h2>
<p>In the event You are required by law, regulation or court order to disclose any Confidential Information, You will promptly notify the Company in writing prior to making any such disclosure in order to allow the Company (or other appropriate Party) to seek a protective order or other appropriate remedy from the proper authority.</p>

<p>You agree to reasonably cooperate with the Company in seeking such order or other remedy.</p>

<p>You further agree that if the Company is not successful in precluding the requesting legal body from requiring the disclosure of the Confidential Information, You will furnish only that portion of the Confidential Information that is legally required to be furnished and will exercise all reasonable efforts to obtain reliable assurances that confidential treatment will be accorded the Confidential Information.</p>

<h2>6. OWNERSHIP AND RETURN OF INFORMATION</h2>
<p>All Confidential Information disclosed under this Agreement (including information in computer software held in electronic storage media) is and will remain the property of the disclosing Party and You have no ownership interest or other rights in or to such information.</p>

<p>You acknowledge and agree that:</p>
<ul>
  <li>Client Information is the property of the applicable Client</li>
  <li>Personal Data is the property of the individual who provided such information</li>
</ul>

<p>You will not retain any Personal Data or Client Information for longer than is necessary for the performance of the services.</p>

<p>All other Confidential Information will be destroyed or returned to the Company promptly upon the earlier of:</p>
<ol type="a">
  <li>Written request</li>
  <li>When it is no longer necessary for the performance of the services</li>
  <li>The termination or expiration of this Agreement</li>
</ol>

<p>You will not thereafter retain Confidential Information in any form. All Confidential Information in any computer memory or data storage apparatus must be erased or destroyed.</p>

<h2>7. TERM AND SURVIVAL</h2>
<p>This Agreement will become effective as of the date first written above and will automatically expire upon the termination of Your services with the Company.</p>

<p>Notwithstanding the termination of this Agreement for any reason whatsoever, all of Your obligations pursuant to this Agreement (and the Company's and all applicable third parties' rights and remedies with respect thereto) will survive with respect to any Confidential Information received prior to such expiration or termination.</p>

<h2>8. REMEDIES FOR BREACH</h2>
<p>You acknowledge that the Confidential Information is unique and valuable, and that disclosure in breach of this Agreement will result in irreparable injury to the Company, Reboo8 or a Client, as applicable, for which monetary damages alone would not be an adequate remedy.</p>

<p>Therefore, You agree that in the event of a breach or threatened breach of confidentiality, the Company is entitled to specific performance and injunctive relief as a remedy for any such breach or anticipated breach without the necessity of posting a bond.</p>

<p>Any such relief will be in addition to and not in lieu of any appropriate relief in the way of monetary damages.</p>

<h2>9. THIRD PARTY BENEFICIARIES</h2>
<p>You and the Company agree that Reboo8 and any Client are third party beneficiaries of this Agreement and that Reboo8 or any Client has the right to the remedies and to take any of the actions described in Section 8 above against You to enforce the terms of this Agreement.</p>

<h2>10. NO WAIVER</h2>
<p>No failure or delay in exercising any right, power or privilege hereunder will operate as a waiver thereof, nor will any single or partial exercise thereof preclude any other or further exercise thereof or the exercise of any right, power or privilege hereunder.</p>

<h2>11. ENTIRE AGREEMENT</h2>
<p>This Agreement:</p>
<ol type="a">
  <li>Is the complete agreement of the Parties concerning the subject matter hereof and supersedes any prior agreements with respect to further disclosures concerning such subject matter; and</li>
  <li>May not be amended or in any manner modified except by a written instrument signed by both Parties.</li>
</ol>

<h2>12. ATTORNEY'S FEES</h2>
<p>If any action is brought for the enforcement of this Agreement, or because of an alleged dispute, breach, default or misrepresentation in connection with any provision of this Agreement, the successful or prevailing Party will be entitled to recover reasonable attorney's fees, costs and all expenses incurred in such action, in addition to any other relief to which such Party or Parties may be entitled.</p>

<p>Attorney's fees will include, without limitation:</p>
<ul>
  <li>Paralegal fees</li>
  <li>Investigative fees</li>
  <li>Administrative costs</li>
  <li>Sales and use taxes</li>
  <li>All other charges billed by the attorney to the prevailing Party</li>
</ul>

<h2>13. SEVERABILITY</h2>
<p>If any provision of this Agreement is found to be unenforceable, the remainder will be enforced as fully as possible and the unenforceable provision will be deemed modified to the limited extent required to permit its enforcement in a manner most closely representing the intention of the Parties as expressed herein.</p>

<h2>14. THIRD PARTY OWNERS</h2>
<p>Any third-party owner of Confidential Information will be deemed to be a third-party beneficiary of this Agreement in the event of any breach or threatened breach of this Agreement by You with respect to such Confidential Information.</p>

<h2>15. COUNTERPARTS</h2>
<p>This Agreement may be executed in one or more counterparts, each of which will be deemed an original, but all of which together will constitute one and the same instrument.</p>

<h2>16. ELECTRONIC AGREEMENT ACKNOWLEDGMENT</h2>
<p><strong>BY SIGNING THIS AGREEMENT ELECTRONICALLY, EACH PARTY ACKNOWLEDGES THAT:</strong></p>
<ol type="A">
  <li>IT CAN ACCESS THIS AGREEMENT COMPLETELY AND FULLY;</li>
  <li>IT HAS BEEN ABLE TO READ THIS AGREEMENT IN ITS ENTIRETY;</li>
  <li>IT HAS SUCCESSFULLY PRINTED OR DOWNLOADED A COPY OF THIS AGREEMENT;</li>
  <li>IT UNDERSTANDS AND AGREES TO ALL TERMS AND CONDITIONS STATED HEREIN;</li>
  <li>IT PROVIDES CONSENT TO BE LEGALLY BOUND BY THIS AGREEMENT.</li>
</ol>

<h2>SIGNATURE BLOCK</h2>
<p><strong>IN WITNESS WHEREOF</strong>, each of the Parties hereto has caused this Agreement to be executed on the date signed below.</p>

<div class="signature-block">
  <div class="signature-column">
    <p><strong>COMPANY</strong></p>
    <p><strong>REBOO8</strong></p>
    <div class="signature-line">
      <p><strong>Authorized Signatory:</strong> Ashank Kumar</p>
      <p><strong>Print Name:</strong> Ashank Kumar</p>
      <p><strong>Title:</strong> Manager</p>
      <p><strong>Date:</strong> {{ACCEPTANCE_DATE}}</p>
    </div>
  </div>

  <div class="signature-column">
    <p><strong>USER / INDIVIDUAL</strong></p>
    <p><strong>E-signed by:</strong> {{USER_NAME}}</p>
    <div class="signature-line">
      <p><strong>Print Name:</strong> {{USER_NAME}}</p>
      <p><strong>Email:</strong> {{USER_EMAIL}}</p>
      <p><strong>Date:</strong> {{ACCEPTANCE_DATE}}</p>
      <p><strong>Timestamp:</strong> {{TIMESTAMP}}</p>
    </div>
  </div>
</div>

<h2>COMPANY ACKNOWLEDGMENT</h2>
<p>Company acknowledges and agrees that the signature on this document will serve as the counterpart signature to any other Non-Disclosure Agreement executed by an authorized user affiliated with Company.</p>

<div class="footer">
  <p><strong>Document Version:</strong> 1.0</p>
  <p><strong>Last Updated:</strong> December 15, 2025</p>
  <p><strong>Jurisdiction:</strong> India</p>
  <p><strong>Legal Framework:</strong> Indian Contract Act, 1872 and Information Technology Act, 2000 (as amended in 2008)</p>
</div>

</body>
</html>
`;

export const MSA_TEMPLATE = `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    ul, ol {
      margin-bottom: 12px;
      padding-left: 40px;
    }
    li {
      margin-bottom: 8px;
    }
    .signature-block {
      margin-top: 40px;
      display: table;
      width: 100%;
    }
    .signature-column {
      display: table-cell;
      width: 48%;
      vertical-align: top;
      padding: 10px;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 60px;
      padding-top: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 10pt;
      color: #666;
    }
  </style>
</head>
<body>

<h1>MASTER SERVICE AGREEMENT</h1>

<p><strong>Effective Date:</strong> {{EFFECTIVE_DATE}}</p>

<h2>INTRODUCTION</h2>
<p>This Master Service Agreement (the "Agreement") is made and entered into as of the date in the signature block below between REBOO8 (the "Company" or "Service Provider") and the individual or entity identified in the signature block below ("Client" or "You").</p>

<h2>RECITALS</h2>
<p>WHEREAS, the Company provides proctored assessment and examination services through its platform (the "Platform");</p>

<p>WHEREAS, the Client desires to engage the Company to provide such services on the terms and conditions set forth in this Agreement;</p>

<p>NOW THEREFORE, in consideration of the foregoing and the mutual promises and covenants set forth herein, and other good and valuable consideration, the adequacy of which is hereby acknowledged, the Parties agree as follows:</p>

<h2>1. DEFINITIONS</h2>

<h3>1.1 "Services"</h3>
<p>"Services" means the proctored assessment and examination platform services provided by the Company, including but not limited to:</p>
<ul>
  <li>Live proctoring capabilities</li>
  <li>Identity verification and authentication</li>
  <li>Assessment delivery and management</li>
  <li>Candidate authentication and monitoring</li>
  <li>Technical support for the Platform</li>
  <li>Report generation and analytics</li>
  <li>Any additional services as specified in a Statement of Work (SOW)</li>
</ul>

<h3>1.2 "Deliverables"</h3>
<p>"Deliverables" means the tangible and intangible outputs resulting from the Services, including but not limited to assessment results, reports, data analytics, and platform access.</p>

<h3>1.3 "Statement of Work (SOW)"</h3>
<p>"SOW" means a document that outlines specific Services, Deliverables, timelines, milestones, and associated fees, executed by both Parties and incorporated by reference into this Agreement.</p>

<h3>1.4 "Service Level Agreement (SLA)"</h3>
<p>"SLA" means a document that specifies the performance standards, uptime commitments, response times, and service credits, as may be agreed upon in writing.</p>

<h3>1.5 "Confidential Information"</h3>
<p>Has the same meaning as defined in the Non-Disclosure Agreement between the Parties, if one exists, or otherwise means all non-public information disclosed by one Party to the other.</p>

<h3>1.6 "Intellectual Property" or "IP"</h3>
<p>Means all patents, copyrights, trademarks, trade secrets, methodologies, software, designs, and other proprietary information created or developed by either Party.</p>

<h2>2. SCOPE OF SERVICES</h2>

<h3>2.1 Service Description</h3>
<p>The Company agrees to provide the Services as detailed in this Agreement and any executed SOW. The Client agrees to use the Services solely for lawful purposes and in accordance with all applicable laws.</p>

<h3>2.2 Service Limitations</h3>
<p>The Services are provided "as-is" and the Company does not warrant that the Services will be uninterrupted, error-free, or suitable for any particular purpose beyond those expressly stated in this Agreement.</p>

<h3>2.3 Support and Maintenance</h3>
<p>The Company shall provide technical support during normal business hours (9:00 AM - 6:00 PM IST, Monday through Friday, excluding public holidays) via email and phone. Extended support options may be available for an additional fee.</p>

<h2>3. TERM AND TERMINATION</h2>

<h3>3.1 Initial Term</h3>
<p>This Agreement shall commence on the Effective Date and continue for an initial term of 12 months (the "Initial Term"), unless earlier terminated as provided herein.</p>

<h3>3.2 Renewal</h3>
<p>Unless either Party provides written notice of non-renewal at least 30 days prior to the expiration of the then-current term, this Agreement shall automatically renew for successive 12-month periods (each a "Renewal Term").</p>

<h3>3.3 Termination for Convenience</h3>
<p>Either Party may terminate this Agreement for any reason with 60 days' written notice to the other Party, provided that:</p>
<ol type="a">
  <li>The terminating Party is not in material breach of this Agreement</li>
  <li>The terminating Party pays any outstanding fees through the notice period</li>
  <li>The Client returns all confidential materials and data within 15 days of termination</li>
</ol>

<h3>3.4 Termination for Cause</h3>
<p>Either Party may terminate this Agreement immediately upon written notice if:</p>
<ol type="a">
  <li>The other Party materially breaches this Agreement and fails to cure such breach within 15 days of receiving written notice</li>
  <li>The other Party engages in fraud, misconduct, or illegal activity</li>
  <li>The other Party becomes insolvent or bankrupt</li>
</ol>

<h3>3.5 Effect of Termination</h3>
<p>Upon termination or expiration of this Agreement:</p>
<ul>
  <li>The Company shall cease providing Services</li>
  <li>The Client shall pay all outstanding invoices immediately</li>
  <li>The Client shall return or certify destruction of Confidential Information</li>
  <li>All data shall be returned to the Client or securely deleted as specified in writing</li>
  <li>Provisions of Sections 5 (Confidentiality), 6 (IP Rights), 7 (Warranties), 8 (Limitation of Liability), 9 (Indemnification), and 11 (Dispute Resolution) shall survive termination</li>
</ul>

<h2>4. PAYMENT TERMS</h2>

<h3>4.1 Fees and Pricing</h3>
<p>The Client agrees to pay the fees as specified in the executed SOW or Order Form (the "Fees"). Fees shall be invoiced:</p>
<ul>
  <li>Monthly in advance (unless otherwise specified)</li>
  <li>Upon completion of milestones (for project-based Services)</li>
  <li>Upon delivery of Deliverables</li>
</ul>

<h3>4.2 Payment Method and Schedule</h3>
<ul>
  <li>Invoices shall be issued on or before the 1st of each month (or as specified in SOW)</li>
  <li>Payment shall be due within 30 days of invoice date</li>
  <li>Payment shall be made via wire transfer, bank transfer, or other method agreed in writing</li>
  <li>Late payments shall accrue interest at the rate of 1.5% per month or the maximum allowed by law, whichever is lower</li>
</ul>

<h3>4.3 Taxes</h3>
<p>All Fees are exclusive of applicable taxes. The Client is responsible for all sales, use, VAT, GST, and other applicable taxes, unless the Client provides a valid tax exemption certificate.</p>

<h3>4.4 Price Adjustments</h3>
<p>The Company reserves the right to increase Fees upon 90 days' written notice, not to exceed 5% per calendar year. Price increases shall take effect upon the commencement of the next Renewal Term.</p>

<h3>4.5 Expenses</h3>
<p>The Client shall reimburse the Company for all reasonable out-of-pocket expenses incurred in providing the Services, including travel, accommodation, and third-party services, upon submission of receipts and approval.</p>

<h2>5. CONFIDENTIALITY AND DATA PROTECTION</h2>

<h3>5.1 Confidential Information</h3>
<p>Each Party agrees to:</p>
<ul>
  <li>Maintain the other Party's Confidential Information in strict confidence</li>
  <li>Use Confidential Information solely for performing obligations under this Agreement</li>
  <li>Limit access to employees and contractors who have a legitimate need to know</li>
  <li>Implement reasonable security measures to protect Confidential Information</li>
</ul>

<h3>5.2 Data Protection and Privacy</h3>
<p>The Company shall:</p>
<ul>
  <li>Comply with the Information Technology Act, 2000 and all applicable data protection laws</li>
  <li>Implement appropriate technical and organizational measures to protect personal data</li>
  <li>Not disclose personal data to third parties without prior written consent</li>
  <li>Allow the Client to request data subject rights (access, deletion, rectification) as applicable</li>
  <li>Maintain records of all personal data processing activities</li>
</ul>

<h3>5.3 Subprocessors</h3>
<p>The Company may engage subprocessors (third parties) to assist in delivering the Services. The Company shall:</p>
<ul>
  <li>Notify the Client of any subprocessor changes at least 30 days in advance</li>
  <li>Require subprocessors to maintain confidentiality and data protection obligations</li>
  <li>Remain liable to the Client for subprocessor performance</li>
</ul>

<h2>6. INTELLECTUAL PROPERTY RIGHTS</h2>

<h3>6.1 Pre-existing IP</h3>
<p>All IP owned or licensed by either Party prior to this Agreement shall remain the property of the originating Party. The Company grants the Client a non-exclusive, non-transferable license to use the Platform and Services during the term of this Agreement.</p>

<h3>6.2 Work Product</h3>
<p>Any work product, reports, analyses, or methodologies created specifically for the Client during the engagement (excluding the Company's standard templates and tools) shall be the property of the Client upon full payment of all Fees.</p>

<h3>6.3 Improvements and Feedback</h3>
<p>The Client grants the Company a royalty-free license to use any feedback, suggestions, or improvements to the Services provided by the Client.</p>

<h3>6.4 Restrictions</h3>
<p>The Client shall not:</p>
<ul>
  <li>Reverse engineer, decompile, or disassemble the Platform</li>
  <li>Attempt to access the source code or underlying infrastructure</li>
  <li>Lease, sell, transfer, or sublicense the Services to third parties</li>
  <li>Create derivative works based on the Platform</li>
</ul>

<h2>7. WARRANTIES AND DISCLAIMERS</h2>

<h3>7.1 Mutual Warranties</h3>
<p>Each Party represents and warrants that:</p>
<ul>
  <li>It has full authority and legal right to enter into this Agreement</li>
  <li>It shall comply with all applicable laws and regulations</li>
  <li>It shall perform its obligations in a professional and timely manner</li>
</ul>

<h3>7.2 Company Warranties</h3>
<p>The Company warrants that:</p>
<ul>
  <li>The Platform is free from viruses, malware, and malicious code (to the best of the Company's knowledge)</li>
  <li>The Company shall use commercially reasonable efforts to maintain the Platform's availability and security</li>
  <li>The Company shall not infringe any third-party IP rights</li>
</ul>

<h3>7.3 Disclaimer of Warranties</h3>
<p><strong>EXCEPT AS EXPRESSLY PROVIDED IN SECTION 7.2, THE COMPANY MAKES NO OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</strong></p>
<p>The Services are provided "as-is" and "as-available" without warranty.</p>

<h3>7.4 Client Responsibility</h3>
<p>The Client is responsible for:</p>
<ul>
  <li>Verifying the accuracy and appropriateness of assessment content</li>
  <li>Ensuring compliance with all applicable laws in the use of the Services</li>
  <li>Maintaining secure passwords and access credentials</li>
  <li>Backing up critical data</li>
</ul>

<h2>8. LIMITATION OF LIABILITY</h2>

<h3>8.1 Cap on Liability</h3>
<p><strong>IN NO EVENT SHALL EITHER PARTY'S TOTAL LIABILITY UNDER THIS AGREEMENT EXCEED THE TOTAL FEES PAID BY THE CLIENT IN THE 12 MONTHS PRECEDING THE CLAIM, OR ₹100,000 (ONE HUNDRED THOUSAND RUPEES), WHICHEVER IS GREATER.</strong></p>

<h3>8.2 Excluded Damages</h3>
<p><strong>NEITHER PARTY SHALL BE LIABLE FOR:</strong></p>
<ul>
  <li>Indirect, incidental, special, consequential, or punitive damages</li>
  <li>Loss of profits, revenue, data, or business opportunity</li>
  <li>Damages arising from the Client's misuse of the Services</li>
  <li>Even if the Party has been advised of the possibility of such damages.</li>
</ul>

<h3>8.3 Exclusions to Cap</h3>
<p>The liability cap in Section 8.1 does not apply to:</p>
<ul>
  <li>Either Party's indemnification obligations (Section 9)</li>
  <li>Breach of confidentiality (Section 5)</li>
  <li>Fraud or gross negligence</li>
  <li>Infringement of third-party IP rights</li>
  <li>Breach of payment obligations</li>
</ul>

<h2>9. INDEMNIFICATION</h2>

<h3>9.1 Company Indemnification</h3>
<p>The Company agrees to indemnify, defend, and hold harmless the Client from any third-party claims that:</p>
<ul>
  <li>The Services or Deliverables infringe any third-party IP rights</li>
</ul>
<p>Provided the Client has promptly notified the Company of the claim and the Company shall be allowed to control the defense and settlement.</p>

<h3>9.2 Client Indemnification</h3>
<p>The Client agrees to indemnify, defend, and hold harmless the Company from any third-party claims that:</p>
<ul>
  <li>The Client's assessment content or data infringes any third-party IP rights</li>
  <li>The Client's use of the Services violates any applicable law</li>
  <li>The Client has breached this Agreement</li>
</ul>

<h3>9.3 Remedies for IP Infringement</h3>
<p>If the Services become subject to an infringement claim, the Company may, at its option:</p>
<ul>
  <li>Obtain the right for the Client to continue using the Services</li>
  <li>Replace the Services with non-infringing alternatives</li>
  <li>Modify the Services to make them non-infringing</li>
  <li>Terminate the Agreement and refund prepaid Fees (pro-rated)</li>
</ul>

<h2>10. SERVICE LEVEL AGREEMENT (SLA)</h2>

<h3>10.1 Uptime Commitment</h3>
<p>The Company commits to maintaining the Platform with a minimum uptime of 99.5% measured on a monthly basis, excluding Scheduled Maintenance and Force Majeure events.</p>

<h3>10.2 Scheduled Maintenance</h3>
<p>The Company may perform scheduled maintenance during off-peak hours (typically 2:00 AM - 6:00 AM IST) with 48 hours' advance notice.</p>

<h3>10.3 Support Response Times</h3>
<ul>
  <li>Critical Issues (service down): 2 hours response time</li>
  <li>High Priority (significant functionality impaired): 8 hours response time</li>
  <li>Medium Priority (minor functionality issues): 24 hours response time</li>
  <li>Low Priority (general inquiries): 2 business days response time</li>
</ul>

<h3>10.4 Service Credits</h3>
<p>If the Company fails to meet the uptime commitment in any calendar month, the Client may be eligible for service credits:</p>
<ul>
  <li>99.0% to 99.4% uptime: 5% credit of monthly Fees</li>
  <li>98.5% to 98.9% uptime: 10% credit of monthly Fees</li>
  <li>Below 98.5% uptime: 25% credit of monthly Fees</li>
</ul>
<p>Service credits are the Client's sole remedy for uptime failures.</p>

<h2>11. FORCE MAJEURE</h2>
<p>Neither Party shall be liable for delays or failures in performance resulting from causes beyond its reasonable control, including but not limited to:</p>
<ul>
  <li>Natural disasters, earthquakes, floods, storms</li>
  <li>War, terrorism, civil unrest</li>
  <li>Government actions or regulations</li>
  <li>Pandemics or epidemics</li>
  <li>Internet service provider failures</li>
  <li>Utility outages</li>
</ul>
<p>The affected Party shall provide prompt notice and make reasonable efforts to resume performance.</p>

<h2>12. DISPUTE RESOLUTION</h2>

<h3>12.1 Informal Resolution</h3>
<p>If a dispute arises, the Parties shall first attempt to resolve it through good-faith negotiation between senior representatives within 15 days of one Party notifying the other.</p>

<h3>12.2 Mediation</h3>
<p>If negotiation fails, the Parties agree to submit the dispute to mediation administered by a mutually agreed mediator in New Delhi, India before pursuing litigation.</p>

<h3>12.3 Governing Law</h3>
<p>This Agreement shall be governed by and construed in accordance with the laws of India, specifically:</p>
<ul>
  <li>The Indian Contract Act, 1872</li>
  <li>The Information Technology Act, 2000</li>
  <li>The Consumer Protection Act, 2019</li>
</ul>

<h3>12.4 Jurisdiction and Venue</h3>
<p>Both Parties irrevocably submit to the exclusive jurisdiction of the courts located in Delhi, India for any legal proceedings arising from this Agreement.</p>

<h3>12.5 Injunctive Relief</h3>
<p>Either Party may seek injunctive relief in any court of competent jurisdiction to prevent breach of this Agreement, without waiving other remedies.</p>

<h2>13. GENERAL PROVISIONS</h2>

<h3>13.1 Entire Agreement</h3>
<p>This Agreement, together with any executed SOW, SLA, and Order Forms, constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, and agreements, whether written or oral.</p>

<h3>13.2 Amendments</h3>
<p>This Agreement may only be amended by a written instrument signed by authorized representatives of both Parties.</p>

<h3>13.3 Assignment</h3>
<p>Neither Party may assign, transfer, or delegate its rights or obligations under this Agreement without the prior written consent of the other Party, except:</p>
<ul>
  <li>The Company may assign to an affiliate or in connection with a merger or sale of assets, provided the Company remains liable</li>
</ul>

<h3>13.4 Severability</h3>
<p>If any provision is found to be unenforceable, it shall be modified to the extent necessary to permit enforcement while preserving the intent, or if impossible, severed. The remainder shall remain in full force.</p>

<h3>13.5 Waiver</h3>
<p>No waiver of any provision is effective unless in writing. A waiver of any breach does not constitute a waiver of any other provision or breach.</p>

<h3>13.6 Counterparts</h3>
<p>This Agreement may be executed in one or more counterparts, each considered an original, but all together constituting one instrument.</p>

<h3>13.7 Notices</h3>
<p>All notices shall be in writing and delivered by:</p>
<ul>
  <li>Hand delivery</li>
  <li>Email with read receipt</li>
  <li>Certified mail with return receipt</li>
  <li>Courier service</li>
</ul>

<h3>13.8 Contact Information</h3>
<p><strong>For the Company:</strong><br>
REBOO8<br>
Attention: Ashank Kumar, Manager<br>
Email: legal@reboo8.com</p>

<p><strong>For the Client:</strong><br>
{{USER_NAME}}<br>
Email: {{USER_EMAIL}}<br>
Phone: {{USER_PHONE}}</p>

<h3>13.9 Relationship of Parties</h3>
<p>The Parties are independent contractors. Nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship.</p>

<h3>13.10 Publicity</h3>
<p>Neither Party may issue a press release or public announcement regarding this Agreement without the other Party's prior written consent, except as required by law.</p>

<h2>14. COMPLIANCE AND REGULATIONS</h2>

<h3>14.1 Legal Compliance</h3>
<p>Both Parties shall comply with all applicable laws, including:</p>
<ul>
  <li>Indian Contract Act, 1872</li>
  <li>Information Technology Act, 2000</li>
  <li>Consumer Protection Act, 2019</li>
  <li>Digital Personal Data Protection Act, 2023 (as applicable)</li>
  <li>Other applicable data protection and privacy laws</li>
</ul>

<h3>14.2 Export Control</h3>
<p>The Client shall not export or re-export the Services or technology to any restricted countries without proper authorization.</p>

<h3>14.3 Anti-Corruption</h3>
<p>Each Party represents that it does not engage in corrupt practices and shall comply with anti-corruption laws.</p>

<h2>15. ELECTRONIC AGREEMENT ACKNOWLEDGMENT</h2>
<p><strong>BY SIGNING THIS AGREEMENT ELECTRONICALLY, EACH PARTY ACKNOWLEDGES THAT:</strong></p>
<ol type="A">
  <li>IT CAN ACCESS THIS AGREEMENT COMPLETELY AND FULLY;</li>
  <li>IT HAS BEEN ABLE TO READ THIS AGREEMENT IN ITS ENTIRETY;</li>
  <li>IT HAS SUCCESSFULLY PRINTED OR DOWNLOADED A COPY OF THIS AGREEMENT;</li>
  <li>IT UNDERSTANDS AND AGREES TO ALL TERMS AND CONDITIONS STATED HEREIN;</li>
  <li>IT PROVIDES CONSENT TO BE LEGALLY BOUND BY THIS AGREEMENT;</li>
  <li>IT HAS AUTHORITY TO ENTER INTO THIS AGREEMENT ON BEHALF OF ITS ORGANIZATION (IF APPLICABLE).</li>
</ol>

<h2>SIGNATURE BLOCK</h2>
<p><strong>IN WITNESS WHEREOF</strong>, each of the Parties hereto has caused this Agreement to be executed on the date signed below.</p>

<div class="signature-block">
  <div class="signature-column">
    <p><strong>SERVICE PROVIDER</strong></p>
    <p><strong>REBOO8</strong></p>
    <div class="signature-line">
      <p><strong>Authorized Signatory:</strong> Ashank Kumar</p>
      <p><strong>Print Name:</strong> Ashank Kumar</p>
      <p><strong>Title:</strong> Manager</p>
      <p><strong>Date:</strong> {{ACCEPTANCE_DATE}}</p>
    </div>
  </div>

  <div class="signature-column">
    <p><strong>CLIENT / INDIVIDUAL</strong></p>
    <p><strong>E-signed by:</strong> {{USER_NAME}}</p>
    <div class="signature-line">
      <p><strong>Print Name:</strong> {{USER_NAME}}</p>
      <p><strong>Email:</strong> {{USER_EMAIL}}</p>
      <p><strong>Date:</strong> {{ACCEPTANCE_DATE}}</p>
      <p><strong>Timestamp:</strong> {{TIMESTAMP}}</p>
    </div>
  </div>
</div>

<h2>COMPANY ACKNOWLEDGMENT</h2>
<p>Company acknowledges and agrees that the signature on this document will serve as the counterpart signature to any other Master Service Agreement executed by an authorized user affiliated with Company.</p>

<div class="footer">
  <p><strong>Document Version:</strong> 1.0</p>
  <p><strong>Last Updated:</strong> December 15, 2025</p>
  <p><strong>Jurisdiction:</strong> India</p>
  <p><strong>Legal Framework:</strong> Indian Contract Act, 1872; Information Technology Act, 2000; Consumer Protection Act, 2019</p>
</div>

<h2>APPENDIX: STANDARD SOW TEMPLATE</h2>
<p>The following elements should be included in any Statement of Work executed under this MSA:</p>
<ol>
  <li><strong>Description of Services</strong> - Specific services and deliverables</li>
  <li><strong>Timeline and Milestones</strong> - Project schedule and key dates</li>
  <li><strong>Fees and Payment Terms</strong> - Pricing, invoicing, and payment schedule</li>
  <li><strong>Acceptance Criteria</strong> - How deliverables will be evaluated</li>
  <li><strong>Resource Allocation</strong> - Team members and their roles</li>
  <li><strong>Change Management</strong> - Process for scope changes and associated costs</li>
  <li><strong>Assumptions and Constraints</strong> - Project limitations and dependencies</li>
</ol>

</body>
</html>
`;
