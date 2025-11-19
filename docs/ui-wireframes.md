# TeamPulse — UI Navigation Structure

## 1. Dashboard (Main App Section)

- **Overview**
- **Activity**
- **Pull Requests**
- **Alerts**
- **Developers**
- **Repositories**
- **Settings**

---

## 2. Developer Pages

- **Developers List**
- **Developer Details**  
  Route: `/developers/[id]`

---

## 3. Repository Pages

- **Repositories List**
- **Repository Details**  
  Route: `/repos/[id]`

---

## 4. Authentication Pages

- **Login with GitHub**
- **Logout**

---

## 5. Future Expansion (Not building now)

- **Landing Page**
- **Pricing**
- **Documentation**
## Page Structure (Next.js App Routing)
/app
  └── dashboard/
        ├── page.tsx                    # dashboard index (redirect to overview)
        ├── overview/
        │     └── page.tsx
        ├── activity/
        │     └── page.tsx
        ├── prs/
        │     └── page.tsx
        ├── alerts/
        │     └── page.tsx
        ├── developers/
        │      ├── page.tsx             # developer list
        │      └── [id]/
        │            └── page.tsx       # developer details
        ├── repos/
        │      ├── page.tsx             # repo list
        │      └── [id]/
        │            └── page.tsx       # repo details
        └── settings/
              └── page.tsx

/login
  └── page.tsx