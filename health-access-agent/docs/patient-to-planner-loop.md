# Patient-to-Planner Health Access Loop

Patients get safer referral guidance; their post-visit feedback enriches facility intelligence for planners.

```mermaid
flowchart LR
  classDef patient fill:#E8F3FF,stroke:#2563EB,stroke-width:1.5px,color:#0B1F3A
  classDef ai fill:#FFF4E6,stroke:#F59E0B,stroke-width:1.5px,color:#2B1700
  classDef data fill:#ECFDF3,stroke:#16A34A,stroke-width:1.5px,color:#052E16
  classDef planner fill:#F5E8FF,stroke:#9333EA,stroke-width:1.5px,color:#2E1065
  classDef guard fill:#FFE4E6,stroke:#E11D48,stroke-width:1.5px,color:#4C0519

  subgraph Patient["Patient-Facing Referral Copilot"]
    P1["Upload injury photo"]
    P2["Describe symptoms in chat"]
    P3["Get care guidance"]
    P4["Visit recommended facility"]
    P5["Post-visit feedback chat"]
  end

  subgraph AI["AI Reasoning Layer"]
    A1["Image + symptom intake"]
    A2["Urgency screening"]
    A3["Referral matcher"]
    A4["Review summarizer"]
    G1["Safety guardrails<br/>Emergency escalation<br/>No diagnosis claims"]
  end

  subgraph Data["Databricks + Lakebase Data Layer"]
    D1["Facilities dataset<br/>services, location, capacity"]
    D2["NFHS-5 indicators<br/>district health need"]
    D3["Pincode directory<br/>last-mile geography"]
    D4["Lakebase feedback table<br/>wait time, trust, cost, outcome"]
    D5["Enriched facility quality view"]
  end

  subgraph Planner["Planner Dashboard"]
    PL1["Medical desert map"]
    PL2["Facility quality signals"]
    PL3["Complaint + trust hotspots"]
    PL4["Intervention recommendations"]
  end

  P1 --> A1
  P2 --> A1
  A1 --> A2
  A2 --> G1
  G1 --> A3

  D1 --> A3
  D2 --> A3
  D3 --> A3

  A3 --> P3
  P3 --> P4
  P4 --> P5
  P5 --> A4
  A4 --> D4

  D1 --> D5
  D4 --> D5
  D5 --> PL2
  D5 --> PL3
  D2 --> PL1
  D3 --> PL1
  PL1 --> PL4
  PL2 --> PL4
  PL3 --> PL4

  class P1,P2,P3,P4,P5 patient
  class A1,A2,A3,A4 ai
  class G1 guard
  class D1,D2,D3,D4,D5 data
  class PL1,PL2,PL3,PL4 planner
```

## Track Coverage

- **Track 2: Medical Desert Planner**: identifies underserved districts and facility gaps.
- **Track 3: Referral Copilot**: helps patients find appropriate care based on injury context and available facilities.
- **Track 4: Data Readiness Desk**: captures post-visit feedback and turns it into structured facility quality signals.
