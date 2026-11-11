# CashPilot — Spécification du projet

> **Sujet de projet · Fintech · React & Next.js**
> Gestion et prévision de trésorerie pour les petites entreprises
> Auteur du sujet : Mohamed Amine Ben Rhouma — Ingénieur et enseignant
>
> Ce fichier est la conversion Markdown du document `Projet_React_NextJS_CashPilot.docx`, adaptée par décision d'équipe : pas de données ni de comptes de démonstration (l'application n'affiche que les données réelles de la base). Il est la **source de vérité fonctionnelle** du projet. L'architecture technique est décrite dans `docs/ARCHITECTURE.md`.

---

## 1. Contexte et objectif

Une entreprise peut réaliser des ventes tout en manquant de liquidités pour payer ses charges. **CashPilot relie les factures, les encaissements, les dépenses et les échéances** afin de suivre la **trésorerie réelle** et d'**anticiper son évolution**.

**Objectif :** développer une application permettant à une petite entreprise de :

1. suivre ses flux financiers,
2. anticiper les difficultés de trésorerie,
3. simuler différentes décisions.

## 2. Utilisateurs

| Rôle | Ce qu'il fait |
|---|---|
| **Dirigeant** | Consulte les indicateurs et approuve les dépenses. |
| **Gestionnaire financier** | Gère les factures, les paiements et les prévisions. |
| **Collaborateur** | Soumet des dépenses et consulte ses demandes. |

> Les droits détaillés sont définis au cadrage (jalon 1).

## 3. Modules à réaliser (fonctionnalités obligatoires)

| Module | Fonctionnalités obligatoires |
|---|---|
| **Entreprise et accès** | Espace entreprise, membres et permissions. |
| **Clients et fournisseurs** | Coordonnées, historique des factures et paiements. |
| **Facturation** | Brouillon, validation, échéance, export PDF et annulation. |
| **Encaissements** | Paiement total ou partiel et calcul du montant restant. |
| **Dépenses** | Catégorie, montant, date, justificatif et statut. |
| **Validation des dépenses** | Soumission → approbation ou refus → paiement. |
| **Trésorerie** | Solde initial, mouvements réalisés et historique. |
| **Prévisions** | Projection à 30, 60 et 90 jours selon les échéances. |
| **Simulation** | Tester un retard client, une nouvelle dépense ou une rentrée prévue. |
| **Alertes et dashboard** | Factures en retard, dépenses à valider et solde prévisionnel négatif. |

## 4. Prévision et validation

### Fonctionnalité centrale : simulation « What if? »

Le moteur calcule une **projection datée** à partir du **solde réel**, des **encaissements attendus** et des **dépenses prévues**. Le simulateur permet de **modifier les hypothèses dans un scénario séparé** et de **comparer la projection initiale à la projection simulée**.

**Exemple :** une entreprise possède 5 000 DT, attend un encaissement de 3 000 DT et prévoit 6 000 DT de dépenses. L'équipe choisit les dates des flux, puis simule un retard de paiement de 20 jours. Le dashboard montre les périodes de manque de liquidités et explique les montants et hypothèses utilisés.

### Calcul attendu

```
solde prévisionnel à une date
  = solde réel de référence
  + encaissements restant attendus jusqu'à cette date
  − décaissements restant prévus jusqu'à cette date
```

### Critères de validation

- Un paiement partiel diminue correctement le reste à payer.
- Une facture ne peut pas être payée au-delà de son montant restant.
- Une dépense refusée ne peut pas être enregistrée comme payée.
- Une opération réalisée affecte le solde réel une seule fois.
- Les montants impayés alimentent la prévision selon leur échéance, sans compter à nouveau les paiements reçus.
- Une simulation ne modifie jamais les données réelles.
- Les données de chaque entreprise restent accessibles uniquement à ses membres autorisés.
- Les opérations financières validées conservent leur historique ; leur correction passe par une opération traçable.
- Les calculs monétaires utilisent une précision adaptée, sans erreurs d'arrondi visibles.

### Scénario de soutenance

Créer une entreprise avec un solde initial → émettre une facture → enregistrer un paiement partiel → soumettre et approuver une dépense → consulter la prévision → simuler un retard de paiement → comparer les deux scénarios.

## 5. Suivi et évaluation

### Jalons du projet

| Étape | Livrables et validation |
|---|---|
| **1. Cadrage** | Besoin, maquettes, modèle de données, règles d'accès et règles de calcul. |
| **2. Version 1** | Accès, clients, factures et paiements partiels. *Démonstration d'une facture avec reste à payer.* |
| **3. Version 2** | Dépenses, approbation et trésorerie réelle. *Vérification du solde après plusieurs opérations.* |
| **4. Version 3** | Prévisions, simulations et alertes. *Comparaison de deux scénarios avec données connues.* |
| **5. Livraison** | Application déployée, README et défense individuelle. |

### Suivi à chaque séance

Présenter une démonstration des tâches terminées, le tableau de tâches actualisé, les difficultés rencontrées, les prochaines tâches et les contributions de chaque membre dans Git.

### Grille d'évaluation — /20

| Critère | Points |
|---|---|
| Fonctionnalités et règles métier | 5 |
| Maîtrise de React / Next.js et qualité du code | 4 |
| Exactitude des calculs et prévisions | 4 |
| Permissions et traçabilité | 2 |
| Interface et visualisation | 2 |
| Suivi Git et maîtrise individuelle | 3 |

## 6. Exigences de réalisation

- Utiliser **React avec Next.js**, des **composants réutilisables** et une **base de données persistante**.
- **Valider les entrées et les permissions côté serveur.**
- Prévoir une **interface responsive**, les **états de chargement, d'erreur et de liste vide**.
- Fournir un **README** avec installation et configuration.

## 7. Personnalisation et périmètre

- Chaque équipe choisit un **secteur** : agence digitale, centre de formation, commerce ou entreprise de services, et **ajoute une fonctionnalité adaptée**.
- Les opérations financières sont **enregistrées ou simulées** ; **aucune intégration bancaire** n'est nécessaire.
- Chaque étudiant **explique son code** et **réalise une petite modification** pendant la soutenance.
- L'utilisation de **ressources externes ou d'outils d'IA doit être déclarée** (à documenter dans le README : Stitch, uiverse.io, OpenCode/Claude, polices, etc.).

---

## Annexe — Points laissés ouverts par le sujet (à trancher au cadrage)

Ces points ne sont **pas** définis dans le sujet et doivent être décidés puis consignés dans `docs/UNDERSTANDING.md` :

1. Matrice détaillée des droits par rôle (qui voit/crée/modifie/annule quoi).
2. Secteur choisi et fonctionnalité originale associée.
3. Gestion de la monnaie (DT / TND, précision : stocker en millimes, entiers).
4. Cycle de vie exact d'une facture (brouillon → validée → partiellement payée → payée → annulée) et d'une dépense (soumise → approuvée / refusée → payée).
5. Règles d'annulation et de correction (opération de contrepartie traçable, jamais de suppression).
6. Définition d'« en retard » (échéance dépassée et reste à payer > 0).
7. Langue de l'interface (français, anglais ou bilingue) et authentification.
