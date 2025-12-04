# Calendrier Visuel — MVP, User Flows, UX & Architecture

## 1. Résumé du projet

Offrir une application ultra-simple pour mettre en relation visuellement les calendriers d'un groupe d'amis et proposer instantanément des créneaux libres — sans passer par des sondages prédéfinis. Interface visuelle, confidentialité maximale (afficher uniquement "occupé / libre"), usage mobile-first.

---

## 2. MVP (Must-have)

**Objectif :** prouver la valeur en permettant à un groupe de 3–10 personnes de trouver et confirmer un créneau en < 60s.

### Fonctionnalités

* Authentification (email/magic link + OAuth Google/Microsoft).
* Connexion des calendriers : Google Calendar (v1), Microsoft/Outlook via Microsoft Graph. Option CalDAV basique pour Apple.
* Agrégation « occupé / libre » (no details) par jour/semaine.
* Vue combinée visuelle (timeline) montrant superposition des disponibilités.
* Drag & drop : proposer un créneau et voir immédiatement qui est libre.
* Validation simple : bouton "Créer l’événement" en 1 clic qui envoie l'invitation calendar (ou lien d'événement).
* Groupes/Rooms : créer un groupe d'amis et inviter par lien.
* Notifications push (ou e‑mail) pour les confirmations.
* Paramètres de confidentialité : toggles pour indiquer si un user partage "occupé/ libre" par défaut.

### Non-MVP (post-lancement)

* Analyse intelligente (suggestions automatiques de créneaux).
* Intégrations supplémentaires (iCal, Teams, Slack).
* Partage anonymisé vs. minuté (afficher raisons d'indisponibilité).
* Événements récurrents, sondages hybrides.

---

## 3. User stories & scénarios rapides

* **Alice** : "Je veux voir rapidement quand mes 4 potes sont dispo ce soir."
* **Bob** : "Je ne veux pas que mes événements privés soient affichés — juste 'occupé'."
* **Claire** : "Je glisse 20:00 et je veux savoir qui peut venir tout de suite."

**Critères d'acceptation MVP** : connexion calendrier réussie (scope minimal), vue combinée correcte, création d'un événement visible dans les calendars des participants.

---

## 4. Flow utilisateur (simplifié)

1. Inscription → créer profil minimal.
2. Inviter amis via lien ou rechercher par email.
3. Chaque ami connecte son calendrier (OAuth).
4. L'appli agrège et affiche la vue combinée.
5. Organisateur glisse-dépose un créneau ; l'app montre en temps réel qui est libre/occupé.
6. Cliquer "Créer" → envoi d'invitations & ajout aux calendriers.

---

## 5. Maquette/UX (wireframes textuels)

* **Écran principal (Group Room)** : header (nom du groupe, icône), timeline horizontale (24h) zoomable, lignes par jour (ou compact). Superposition colorée par utilisateur (opacité indiquant overlap). Toggle "Afficher noms" / "Masquer détails".

* **Mode Proposer** : bouton flottant + panneau latéral : pickers durée (30/60/120 min), glisser-déposer sur la timeline ; badge indiquant % de participants dispo.

* **Card utilisateur** : avatar, statut (connecté, last sync), toggle confidentialité (share free/busy).

* **Écran connexion calendrier** : explication minimaliste + boutons OAuth par fournisseur + indicator de permissions demandées.

* **Écran confirmation événement** : récap (titre, lieu libre-text, date/heure, participants, bouton envoyer). Option "envoyer sans details" (invitations marquées 'occupé').

UI notes : très visuel, icônes grandes, interactions par gestes (mobile). Favoriser contrastes et micro-animations pour feedback.

---

## 5 bis. Choix PWA vs App native

### Pourquoi démarrer par une PWA

* Développement rapide et économique : une seule base de code
* Déploiement immédiat, pas de stores ni validation
* Adoption facile : un simple lien à partager dans un groupe d'amis
* Fonctionnalités suffisantes pour le MVP (offline léger, installation, notifications Web Push)
* Parfait pour tester la proposition de valeur avant d’investir dans une app complète

### Quand envisager une app native (plus tard)

* Besoin de notifications iOS plus robustes
* Intégration profonde avec le calendrier local
* Optimisations graphiques avancées
* Présence sur App Store / Play Store pour visibilité

---

## 6. Architecture technique (Validée — Mise à jour Décembre 2024)

### Structure & Infrastructure
* **Framework** : Next.js 16 (App Router) — frontend + API unifiés.
* **Package Manager** : pnpm.
* **Local Dev** : PostgreSQL 16 (Windows).
* **Déploiement** : Vercel (recommandé) ou Railway/Render.

### Application (src/)
* **Stack** : Next.js 16 + React 19 + TypeScript.
* **Styling** : Tailwind CSS 4.
* **State** : React Server Components + Client hooks.
* **Auth** : Better Auth (OAuth Google + Email/Password).
* **ORM** : Prisma 7 (type-safe, PostgreSQL).

### Fichiers clés
* `src/lib/auth.ts` — Configuration Better Auth serveur.
* `src/lib/auth-client.ts` — Client React pour l'auth.
* `src/app/api/auth/[...all]/route.ts` — API routes auth.
* `prisma/schema.prisma` — Schéma base de données.

---

## 7. Intégration Calendrier — points techniques

* **Google** : OAuth scopes `https://www.googleapis.com/auth/calendar.events.readonly` *or* `freeBusy` minimal (`https://www.googleapis.com/auth/calendar.readonly` + freeBusy query). Use push notifications (watch API) to reduce polling.
* **Microsoft** : Microsoft Graph (Calendars.ReadBasic for free/busy).
* **Apple** : CalDAV fallback (plus complexe) — pour MVP, proposer import iCal ou manuel.

**Important** : ne jamais demander/stocke les détails d'événements si user choisit "free/busy only".

---

## 8. Confidentialité & conformité (RGPD)

* Consentement explicite à la connexion calendrier.
* Scopes minimaux (free/busy only quand possible).
* Stockage des tokens chiffrés, accès restreint.
* Option suppression complète de toutes les données utilisateur.
* Politique de rétention : snapshots free/busy conservés max 30 jours par défaut.
* Fournir export & suppression (droit à l'oubli).

---

## 9. Roadmap (6–12 semaines initial)

* **Semaine 0–2** : Spec détaillée + prototypage UI (Figma) + décider stack.
* **Semaine 3–6** : Développement backend minimal (auth, connecteurs Google, stockage free/busy) + frontend view combined (web).
* **Semaine 7–8** : Room flow, drag & drop proposer + event creation.
* **Semaine 9–10** : Tests utilisateurs, bugfix, RGPD checklist.
* **Semaine 11–12** : Lancement bêta fermée, collecte feedback.

---

## 10. KPIs & succès

* Temps moyen pour créer un événement (objectif MVP < 60s).
* % d'utilisateurs qui connectent un calendrier.
* Taux de match (créneaux trouvés en 1 tentative).
* Rétention 1 semaine après première utilisation.

---

## 11. Prochaines étapes immédiates (livrables actionnables)

1. **Setup Monorepo** : Init Turborepo, config ESLint/TS, install PostgreSQL/Redis local.
2. **Auth System** : Login Magic Link + OAuth Google/Microsoft (Fastify + Passport).
3. **Calendar Core** : Connecteur Google Calendar (free/busy) + Job de sync (BullMQ).
4. **UI Foundation** : Setup Tailwind, composants de base, routing PWA.

---

## Annexes rapides

* **Endpoints API suggérés (MVP)** :

  * `POST /auth/oauth/google` — exchange code & store token
  * `GET /rooms/:id/availability?range=...` — retourne snapshot free/busy
  * `POST /rooms/:id/propose` — propose un créneau
  * `POST /rooms/:id/event` — crée l'événement (send invites)

* **DB fields clés** : `users(id,email,avatar)`, `calendar_accounts(user_id,provider,encrypted_token,last_sync)`, `rooms(id,name,owner_id)`, `memberships(room_id,user_id,role,share_freebusy)`.