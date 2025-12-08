# Backend Architecture Flowcharts

## 1. Backend System Architecture

```mermaid
graph TB
    subgraph "Entry Point"
        A[server.js] --> B[Load Environment Variables]
        B --> C[Import Express App]
        C --> D[Connect to PostgreSQL via Prisma]
        D --> E[Start HTTP Server on PORT]
        E --> F[Setup Graceful Shutdown Handlers]
    end
    
    subgraph "Express App Configuration - app.js"
        G[Express App] --> H[Security Middleware - Helmet]
        H --> I[Compression]
        I --> J[Logging - Morgan]
        J --> K[Rate Limiting]
        K --> L[CORS Configuration]
        L --> M[Body Parsers - JSON/URL-encoded]
        M --> N[Passport.js Initialization]
        N --> O[Health Check Endpoint]
        O --> P[API Routes - /api/v1]
        P --> Q[404 Handler]
        Q --> R[Global Error Handler]
    end
    
    E --> G
    
    subgraph "Route Organization"
        P --> S[Core Routes - /]
        P --> T[Proctoring Routes - /proctoring]
        P --> U[Chatbot Routes - /chatbot]
    end
    
    subgraph "Core Routes"
        S --> V[Auth Routes]
        S --> W[Agent Routes]
        S --> X[Client Routes]
        S --> Y[Opportunity Routes]
        S --> Z[Project Routes]
        S --> AA[OTP Routes]
        S --> AB[Profile Routes]
    end
    
    subgraph "Proctoring Routes"
        T --> AC[Assessment Routes]
        T --> AD[System Check Routes]
        T --> AE[Identity Verification Routes]
        T --> AF[Instruction Routes]
    end
    
    subgraph "Chatbot Routes"
        U --> AG[AI Routes]
        U --> AH[Conversation Routes]
        U --> AI[FAQ Routes]
        U --> AJ[Analytics Routes]
        U --> AK[Support Routes]
    end
    
    style A fill:#ff6b6b
    style G fill:#4ecdc4
    style P fill:#45b7d1
    style S fill:#96ceb4
    style T fill:#ffeaa7
    style U fill:#dfe6e9
```

## 2. Authentication Flow - Signup & Login

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthController
    participant OTPService
    participant Database
    participant EmailService
    participant TokenUtil
    
    Note over User,TokenUtil: SIGNUP FLOW
    
    User->>Frontend: Enter email/phone
    Frontend->>AuthController: POST /api/v1/otp/generate
    AuthController->>OTPService: generateOTP(email, phone, type)
    OTPService->>OTPService: Generate 6-digit code
    OTPService->>Database: Create OTP record (expires in 10 min)
    OTPService->>EmailService: Send OTP via email/SMS
    EmailService-->>User: OTP Code
    AuthController-->>Frontend: OTP sent confirmation
    
    User->>Frontend: Enter OTP code
    Frontend->>AuthController: POST /api/v1/otp/verify
    AuthController->>Database: Find OTP by code & target
    AuthController->>AuthController: Validate expiry & consumed status
    AuthController->>Database: Update User (emailVerified: true)
    AuthController->>Database: Mark OTP as consumed
    AuthController-->>Frontend: Verification success
    
    User->>Frontend: Set password
    Frontend->>AuthController: POST /api/v1/auth/signup
    AuthController->>AuthController: Validate credentials (email, phone, password)
    AuthController->>AuthController: Hash password with bcrypt
    AuthController->>Database: Update User (passwordHash, status: ACTIVE)
    AuthController->>Database: Create Agent profile
    AuthController->>TokenUtil: generateToken(userId, role, status)
    TokenUtil-->>AuthController: JWT Token
    AuthController-->>Frontend: Token + User data
    Frontend->>Frontend: Store token in localStorage
    Frontend->>Frontend: Redirect to /profile-registration
    
    Note over User,TokenUtil: LOGIN FLOW
    
    User->>Frontend: Enter email/phone + password
    Frontend->>AuthController: POST /api/v1/auth/login
    AuthController->>Database: Find User by email/phone
    AuthController->>AuthController: Compare password hash
    AuthController->>Database: Fetch Agent profile
    AuthController->>Database: Fetch Candidate & Assessment
    AuthController->>AuthController: Calculate nextStep
    AuthController->>TokenUtil: generateToken(userId, role, status)
    TokenUtil-->>AuthController: JWT Token
    AuthController-->>Frontend: Token + User + registrationStatus
    Frontend->>Frontend: Store token in localStorage
    Frontend->>Frontend: Redirect based on nextStep
```

## 3. Agent Onboarding Flow

```mermaid
graph TD
    A[User Visits Platform] --> B{Has Account?}
    B -->|No| C[Email/Phone Verification - OTP]
    B -->|Yes| D[Login]
    
    C --> E[Set Password - Signup]
    E --> F[User Created - Status: ACTIVE]
    F --> G[Agent Profile Auto-Created]
    
    D --> H{Check Registration Status}
    
    H --> I{Email/Phone Verified?}
    I -->|No| C
    I -->|Yes| J{Profile Completed?}
    
    J -->|No| K[Profile Registration Page]
    K --> L[Enter Personal Details]
    L --> M[Add Qualifications]
    M --> N[Add Experience]
    N --> O[Upload Profile Photo]
    O --> P[Save Profile - profileCompleted: true]
    
    J -->|Yes| Q{KYC Status?}
    
    Q -->|PENDING/REJECTED| R[KYC Verification Page]
    R --> S[Upload Aadhar - Front & Back]
    S --> T[Upload PAN Card]
    T --> U[Submit for Verification]
    U --> V{Admin Review}
    V -->|Approved| W[kycStatus: APPROVED]
    V -->|Rejected| X[kycStatus: REJECTED - Retry]
    X --> R
    
    Q -->|APPROVED| Y{Assessment Status?}
    
    Y -->|NOT_STARTED/FAILED| Z[Assessment Instructions]
    Z --> AA[System Check]
    AA --> AB{System Compatible?}
    AB -->|No| AC[Show Requirements & Exit]
    AB -->|Yes| AD[Device Test - Webcam/Mic]
    AD --> AE{Devices Working?}
    AE -->|No| AC
    AE -->|Yes| AF[Identity Verification]
    AF --> AG{Face Verified?}
    AG -->|No| AH[Retry or Manual Review]
    AG -->|Yes| AI[Enter Fullscreen]
    AI --> AJ[Start Proctored Test]
    AJ --> AK[Complete Assessment]
    AK --> AL[Assessment Evaluated]
    AL --> AM[CEFR Level Assigned]
    
    Y -->|COMPLETED| AN{Agreement Signed?}
    
    AN -->|No| AO[Agreements Page]
    AO --> AP[Review Terms & Conditions]
    AP --> AQ[Digital Signature]
    AQ --> AR[agreementSigned: true]
    
    AN -->|Yes| AS[Dashboard Access]
    
    P --> Q
    W --> Y
    AM --> AN
    AR --> AS
    
    AS --> AT[Browse Opportunities]
    AT --> AU[Apply for Gigs]
    AU --> AV[Work & Earn]
    
    style A fill:#e1f5ff
    style AS fill:#69f0ae
    style AV fill:#ffd54f
```

## 4. Opportunity Application & Gig Flow

```mermaid
graph TB
    subgraph "Client Side"
        A[Client Creates Project] --> B[Define Requirements]
        B --> C[Create Opportunities]
        C --> D[Set Skills, CEFR, Experience]
        D --> E[Define Time Slots]
        E --> F[Publish Opportunity - Status: OPEN]
    end
    
    subgraph "Agent Side"
        G[Agent Browses Opportunities] --> H{Meets Requirements?}
        H -->|No| I[View Other Opportunities]
        H -->|Yes| J[Apply for Opportunity]
        J --> K[GigApplication Created - Status: PENDING]
    end
    
    subgraph "Review & Selection"
        K --> L[Client Reviews Application]
        L --> M{Decision}
        M -->|Reject| N[Status: REJECTED]
        M -->|Accept| O[Status: ACCEPTED]
        O --> P[SelectedGig Created]
        P --> Q[Agent Selects Time Slots]
        Q --> R[AgentWorkSlot Created]
    end
    
    subgraph "Work Execution"
        R --> S[Agent Logs In - ActivityLog]
        S --> T[Perform Work]
        T --> U[Handle Tickets/Tasks]
        U --> V[Log Breaks - ActivityLog]
        V --> W[Agent Logs Out - ActivityLog]
        W --> X[Submit Deliverables]
        X --> Y[SubmittedWork Created - Status: PENDING]
    end
    
    subgraph "Review & Payment"
        Y --> Z[Client Reviews Work]
        Z --> AA{Quality Check}
        AA -->|Approved| AB[Status: APPROVED]
        AA -->|Rejected| AC[Status: REJECTED]
        AA -->|Needs Rework| AD[Status: REWORK_NEEDED]
        AD --> AE[Agent Revises Work]
        AE --> AF[Status: REWORK_SUBMITTED]
        AF --> Z
        AB --> AG[Payment Processed]
        AG --> AH[Both Parties Leave Reviews]
        AH --> AI[Gig Status: COMPLETED]
    end
    
    F --> G
    
    style F fill:#4ecdc4
    style K fill:#ffeaa7
    style P fill:#96ceb4
    style AB fill:#69f0ae
    style AI fill:#45b7d1
```

## 5. Proctoring & Assessment System Flow

```mermaid
graph TD
    A[Agent Clicks Start Assessment] --> B[Instructions Page]
    B --> C[Accept Terms & Start]
    
    C --> D[System Check Phase]
    D --> E[Check Browser Compatibility]
    E --> F[Check Operating System]
    F --> G[Check Camera Availability]
    G --> H[Check Microphone Availability]
    H --> I[Check Network Speed]
    I --> J[Check Screen Resolution]
    J --> K[Check Fullscreen Capability]
    
    K --> L{All Checks Passed?}
    L -->|No| M[Display Failed Checks]
    M --> N[Show System Requirements]
    N --> O[Exit Assessment]
    
    L -->|Yes| P[SystemCheck Record - Status: PASSED]
    P --> Q[Device Test Page]
    
    Q --> R[Test Webcam Feed]
    R --> S[Test Microphone Recording]
    S --> T{Devices Working?}
    T -->|No| M
    T -->|Yes| U[Identity Verification Phase]
    
    U --> V[Load Face Detection Models]
    V --> W[Capture Live Photo]
    W --> X[Detect Face in Photo]
    X --> Y{Face Detected?}
    Y -->|No| Z[Show Error - Retry]
    Z --> W
    
    Y -->|Yes| AA[Extract Face Descriptor]
    AA --> AB[Compare with Reference Photo]
    AB --> AC{Similarity > Threshold?}
    AC -->|No| AD[Verification Failed]
    AD --> AE[Manual Review or Retry]
    AC -->|Yes| AF[IdentityVerification - Status: VERIFIED]
    
    AF --> AG[Enter Fullscreen Mode]
    AG --> AH[Create ProctoringSession]
    AH --> AI[Start Assessment Timer]
    
    AI --> AJ[Display Questions]
    
    subgraph "Real-time Monitoring"
        AK[Face Detection Every 5s]
        AL[Tab Switch Detection]
        AM[Fullscreen Exit Detection]
        AN[Mouse Leave Detection]
        AO[Keyboard Shortcut Detection]
        AP[Right-Click Detection]
        AQ[Network Disconnection Detection]
    end
    
    AJ --> AR{Violation Detected?}
    AR -->|Yes| AS[Create ProctoringLog]
    AS --> AT[Capture Screenshot - ViolationSnapshot]
    AT --> AU{Critical Violation?}
    AU -->|Yes| AV[Auto-Submit Test]
    AU -->|No| AW{Violation Count > Threshold?}
    AW -->|Yes| AV
    AW -->|No| AJ
    
    AR -->|No| AJ
    
    AJ --> AX{Time Up or All Answered?}
    AX -->|No| AJ
    AX -->|Yes| AY[Submit Test]
    
    AV --> AY
    
    AY --> AZ[Evaluate Answers]
    
    subgraph "Answer Evaluation"
        BA[AUDIO_MCQ - Auto-scored]
        BB[READING_MCQ - Auto-scored]
        BC[FILL_BLANK - Auto-scored]
        BD[SPEAKING - AssemblyAI Transcription]
        BD --> BE[Fluency, Accuracy, Pronunciation Scoring]
        BF[WRITING - Manual/AI Review]
        BF --> BG[Grammar, Coherence, Vocabulary Scoring]
    end
    
    AZ --> BH[Calculate Weighted Score]
    BH --> BI[Assign CEFR Level - A1 to C2]
    BI --> BJ[Update CandidateAssessment - Status: COMPLETED]
    BJ --> BK[Update Candidate - overallCEFRLevel]
    BK --> BL[Thank You Page]
    BL --> BM[Redirect to Next Step]
    
    style A fill:#e1f5ff
    style P fill:#69f0ae
    style AF fill:#69f0ae
    style AV fill:#ff6b6b
    style BJ fill:#4ecdc4
```

## 6. Chatbot System Flow

```mermaid
graph TD
    A[User Opens Chatbot Widget] --> B[Initialize Conversation]
    B --> C[Create Conversation Record]
    C --> D[Display Welcome Message]
    
    D --> E[User Sends Message]
    E --> F[Create Message Record - Role: USER]
    
    F --> G[FAQ Matching Phase]
    G --> H[Extract Keywords from Message]
    H --> I[Search FAQ Database]
    I --> J{FAQ Match Found?}
    
    J -->|Yes| K{Confidence > 80%?}
    K -->|Yes| L[Return FAQ Answer]
    L --> M[Create Message - Role: ASSISTANT, Source: FAQ]
    M --> N[Display Response to User]
    
    K -->|No| O[AI Generation Phase]
    J -->|No| O
    
    O --> P[Fetch Conversation History - Last 10 Messages]
    P --> Q[Build Context with System Prompt]
    Q --> R[Send to AI Service - Groq/Gemini]
    R --> S[AI Generates Response]
    S --> T[Create Message - Role: ASSISTANT, Source: AI]
    T --> N
    
    N --> U{User Satisfied?}
    U -->|Yes| V[User Provides Positive Feedback]
    V --> W[Update Message.feedback - POSITIVE]
    
    U -->|No| X[User Provides Negative Feedback]
    X --> Y[Update Message.feedback - NEGATIVE]
    Y --> Z{Offer Custom Question?}
    Z -->|Yes| AA[Create CustomQuestion Record]
    AA --> AB[Notify Admin for Manual Response]
    
    U -->|Escalate| AC[User Requests Human Support]
    AC --> AD[Create SupportTicket]
    AD --> AE[Assign to Support Agent]
    AE --> AF[Support Agent Responds]
    
    N --> AG[User Sends Another Message]
    AG --> E
    
    subgraph "Analytics Tracking"
        AH[Track Total Conversations]
        AI[Track Messages per Conversation]
        AJ[Calculate FAQ Hit Rate]
        AK[Calculate AI Response Rate]
        AL[Measure Average Response Time]
        AM[Calculate User Satisfaction Ratio]
        AN[Identify Common Topics/Keywords]
    end
    
    W --> AO[Continue Conversation or End]
    AB --> AO
    AF --> AO
    
    style A fill:#e1f5ff
    style L fill:#69f0ae
    style S fill:#4ecdc4
    style AD fill:#ffeaa7
```

## 7. Database Schema Relationships

```mermaid
erDiagram
    User ||--o| Agent : "has one"
    User ||--o{ OTP : "receives"
    
    Agent ||--o{ Qualification : "has many"
    Agent ||--o{ Experience : "has many"
    Agent ||--o| Employment : "has one"
    Agent ||--o{ KYCDocument : "has many"
    Agent ||--o{ GigApplication : "applies to"
    Agent ||--o{ Review : "receives"
    Agent ||--o{ Conversation : "starts"
    Agent ||--o| Candidate : "becomes"
    
    Client ||--o{ Project : "creates"
    Client ||--o{ Review : "receives"
    Client ||--o{ Dispute : "involved in"
    
    Project ||--o{ Opportunity : "contains"
    
    Opportunity ||--o{ GigApplication : "receives"
    Opportunity ||--o{ ClientScheduleSlot : "has"
    
    GigApplication ||--o| SelectedGig : "becomes"
    GigApplication ||--o{ Dispute : "may have"
    
    SelectedGig ||--o{ ActivityLog : "tracks"
    SelectedGig ||--o{ SubmittedWork : "produces"
    SelectedGig ||--o{ Review : "receives"
    SelectedGig ||--o{ Dispute : "may have"
    SelectedGig ||--o| AgentWorkSlot : "has schedule"
    
    ClientScheduleSlot ||--o{ AgentWorkSlot : "filled by"
    
    SubmittedWork ||--o{ Review : "receives"
    SubmittedWork ||--o{ Dispute : "may have"
    SubmittedWork ||--o{ Payment : "triggers"
    
    Payment ||--o{ Dispute : "may have"
    
    Candidate ||--o{ SystemCheck : "performs"
    Candidate ||--o{ IdentityVerification : "undergoes"
    Candidate ||--o{ CandidateAssessment : "attempts"
    Candidate ||--o{ ProctoringLog : "generates"
    Candidate ||--o{ ProctoringSession : "participates in"
    Candidate ||--o{ Answer : "submits"
    Candidate ||--o{ SpeakingEvaluation : "receives"
    Candidate ||--o{ Blacklist : "may be in"
    
    Assessment ||--o{ CandidateAssessment : "taken by"
    Assessment ||--o{ Question : "contains"
    
    CandidateAssessment ||--o| ProctoringSession : "has"
    CandidateAssessment ||--o{ Answer : "contains"
    
    ProctoringSession ||--o{ ProctoringLog : "records"
    
    ProctoringLog ||--o| ViolationSnapshot : "may have"
    
    Question ||--o{ Answer : "answered by"
    
    Answer ||--o| SpeakingEvaluation : "may have"
    
    Conversation ||--o{ Message : "contains"
    
    Message }o--o| FAQ : "may reference"
    
    FAQ ||--o{ Message : "used in"
```

## 8. API Request Flow with Middleware

```mermaid
graph LR
    A[Client Request] --> B[Express App]
    B --> C[Helmet - Security Headers]
    C --> D[Compression]
    D --> E[Morgan - Logging]
    E --> F[Rate Limiter]
    F --> G{Rate Limit Exceeded?}
    G -->|Yes| H[429 Too Many Requests]
    G -->|No| I[CORS Validation]
    I --> J{Origin Allowed?}
    J -->|No| K[403 Forbidden]
    J -->|Yes| L[Body Parser]
    L --> M[Route Matching]
    M --> N{Protected Route?}
    N -->|Yes| O[Auth Middleware]
    O --> P{Valid JWT Token?}
    P -->|No| Q[401 Unauthorized]
    P -->|Yes| R{Required Role?}
    R -->|No| S[403 Insufficient Permissions]
    R -->|Yes| T[Controller]
    N -->|No| T
    T --> U[Service Layer]
    U --> V[Database - Prisma]
    V --> W[Response]
    W --> X[Success Response]
    
    T --> Y{Error Occurred?}
    Y -->|Yes| Z[Error Handler Middleware]
    Z --> AA[Error Response]
    
    M --> AB{Route Not Found?}
    AB -->|Yes| AC[404 Handler]
    AC --> AD[404 Not Found Response]
    
    style A fill:#e1f5ff
    style X fill:#69f0ae
    style H fill:#ff6b6b
    style K fill:#ff6b6b
    style Q fill:#ff6b6b
    style S fill:#ff6b6b
    style AA fill:#ff6b6b
    style AD fill:#ff6b6b
```

---

## Summary

These flowcharts illustrate the complete backend architecture of the HitouchCX platform, including:

1. **System Architecture**: Server initialization, Express configuration, and route organization
2. **Authentication**: Signup and login flows with OTP verification
3. **Agent Onboarding**: Multi-step registration process from signup to dashboard access
4. **Opportunity Management**: Application, selection, work execution, and payment flow
5. **Proctoring System**: Comprehensive assessment flow with real-time monitoring
6. **Chatbot System**: FAQ matching, AI generation, and support escalation
7. **Database Relationships**: Entity relationships across 30+ models
8. **API Request Flow**: Middleware stack and request processing pipeline

The backend is built with security, scalability, and maintainability as core principles, using modern Node.js/Express patterns with Prisma ORM for database management.
