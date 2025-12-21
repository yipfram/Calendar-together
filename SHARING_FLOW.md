# Sequence Diagrams: Availability Sharing

## Create Share Link Flow
This diagram illustrates the process of a user creating a new shared availability link.

```mermaid
sequenceDiagram
    actor User as User (Sharer)
    participant UI as Dashboard / Modal
    participant API as /api/share
    participant DB as Database

    User->>UI: Open Share Modal
    UI->>User: Display Form (Duration, Visibility)
    User->>UI: Select Options & Click "Create Link"
    UI->>API: POST /api/share { startDate, endDate, visibility, allowedEmails }
    activate API
    API->>API: Validate Session
    API->>DB: Create AvailabilityShareLink
    activate DB
    DB-->>API: Created Link Record
    deactivate DB
    API-->>UI: Return { link: { token, ... } }
    deactivate API
    UI->>User: Display Generated Link
```

## View Shared Availability Flow
This diagram illustrates the process of an external user (or the same user) accessing a shared availability link.

```mermaid
sequenceDiagram
    actor Viewer as Viewer
    participant Page as /share/[token] Page
    participant API as /api/share/[token]
    participant DB as Database
    participant Google as Google Calendar API

    Viewer->>Page: Access /share/[token]
    activate Page
    Page->>API: GET /api/share/[token]
    activate API
    API->>DB: Find Link by Token
    activate DB
    DB-->>API: Link Data (active, dates, visibility)
    deactivate DB

    alt Link Not Found / Inactive
        API-->>Page: 404 Error
        Page-->>Viewer: "Link not found"
    else Link Expired
        API-->>Page: 410 Error
        Page-->>Viewer: "Link expired"
    end

    opt Visibility Check
        alt Visibility = Authenticated
            API->>API: Check User Session
            alt No Session
                API-->>Page: 401 Unauthorized
                Page-->>Viewer: Redirect to /sign-in
            end
        else Visibility = Restricted
            API->>API: Check Session & Allowed Emails
            alt Email Not Allowed
                API-->>Page: 403 Forbidden
                Page-->>Viewer: "Access Denied"
            end
        end
    end

    note over API: Validation Passed

    API->>Google: getFreeBusy(userId, timeMin, timeMax)
    activate Google
    Google-->>API: Busy Slots []
    deactivate Google

    API-->>Page: JSON { availability, user, link }
    deactivate API

    Page->>Viewer: Render Calendar with Busy Slots
    deactivate Page
```
