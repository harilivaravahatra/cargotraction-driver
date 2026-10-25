# CargoTraction Chauffeurs — plan d’implémentation

## Périmètre approuvé

Application PWA mobile-first pour les chauffeurs CargoTraction, connectée au projet Supabase existant et empaquetable via Capacitor. Aucun GPS ni suivi automatique de position. Les seules preuves terrain sont les actions explicites du chauffeur, horodatées côté serveur lors de la synchronisation.

## Approche technique

- Frontend React 18 + TypeScript + Vite + TailwindCSS.
- Icônes avec `lucide-react`.
- Connexion Supabase facultative via `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`; `VITE_DEMO_MODE=true` active le scénario local sans réseau.
- Adaptateur de données unique (`dataClient`) pour isoler le mode réel Supabase du mode démo.
- IndexedDB sans dépendance supplémentaire pour conserver les événements, photos et messages hors ligne; les identifiants clients assurent l’idempotence.
- Uploads compressés côté navigateur vers le bucket privé `mission-documents` avec chemin cloisonné par chauffeur et mission.
- OCR représenté par un point d’extension facultatif: l’interface accepte une suggestion mais n’enregistre jamais une valeur sans validation humaine.
- Edge Functions Supabase séparées pour le login PIN et sa définition admin/dispatcher.
- RPC `SECURITY DEFINER` séparées pour toutes les écritures chauffeur; aucune écriture directe dans `missions`.

## Sécurité et compatibilité avec l’existant

- Ajout uniquement des trois colonnes explicitement autorisées dans `public.drivers`.
- Nouvelles tables, fonctions et policies portent le préfixe `driver_` ou un nom propre au module.
- Les policies existantes ne sont ni supprimées ni remplacées.
- La migration de policies sur les tables existantes vérifie que la RLS est déjà active et échoue explicitement sinon, afin de ne pas bloquer l’application dispatcher/admin par surprise.
- Les nouvelles tables ont leur propre RLS et utilisent `public.current_driver_id()` pour rattacher `auth.uid()` à `drivers.auth_user_id`.
- `profiles.role` est utilisé par `driver-set-pin` pour autoriser uniquement `admin` et `dispatcher`.

## Design

### Styles envisagés

- **Terrain industriel calme** — probabilité 0,06 : panneaux d’action très lisibles, surfaces mates et hiérarchie robuste.
- **Bassin portuaire contemporain** — probabilité 0,05 : bleu profond, lignes techniques et rythme compact.
- **Minimalisme administratif** — probabilité 0,04 : densité fonctionnelle, peu de décoration et formulaires directs.

### Direction retenue : Terrain industriel calme

- **Mouvement** : signalétique industrielle et interfaces de cabine, avec des blocs d’information courts qui se lisent debout et en mouvement.
- **Principes** : priorité à l’action, une seule décision par zone, contraste fort, état réseau toujours visible.
- **Philosophie couleur** : `#0e5165` évoque le bassin et la fiabilité; `slate-50` réduit l’éblouissement; l’ambre signale les éléments à vérifier sans devenir une alerte agressive; le vert est réservé aux validations.
- **Paradigme de mise en page** : colonne unique avec en-tête fixe, cartes empilées et barre d’action ancrée en bas des fiches mission.
- **Signatures** : pastille réseau, rail vertical des étapes, et boutons primaires très hauts avec icône + verbe.
- **Interaction** : chaque action affiche son résultat immédiatement, est réessayable, et devient une file hors ligne clairement annoncée quand le réseau est absent.
- **Animation** : transitions courtes de 160–220 ms; aucun mouvement décoratif continu; les états synchronisés utilisent un fondu discret et les validations un léger déplacement vertical.
- **Typographie** : système sans-serif natif, titres `font-semibold` généreux, texte courant minimum 16 px; chiffres et codes en `font-mono` pour faciliter la lecture terrain.
- **Essence** : la feuille d’expédition en temps réel, conçue pour décider vite et prouver chaque étape. Personnalités : fiable, directe, rassurante.
- **Voix** : impératifs courts et factuels. Exemples : « Confirmez l’arrivée quand vous êtes sur place. » et « La photo sera envoyée dès que le réseau revient. »
- **Logo** : `LogoSlot` reste volontairement vide et conserve une zone stable pour l’image de marque de CargoTraction.
- **Couleur signature** : Bleu Bassin `#0e5165`.

## Structure projet

```text
src/
  app/                 orchestration de navigation et écrans
  components/          cartes, boutons, logo, états réseau
  data/                types, données démo et client Supabase
  lib/                 IndexedDB, compression, OCR et helpers
  styles/              thème Tailwind et styles globaux
supabase/
  migrations/          SQL numéroté, sans modification destructive
  functions/           driver-login et driver-set-pin
public/                manifest PWA, routes Webdev, icônes
```

## Flux fonctionnels

1. Le chauffeur saisit son matricule et son PIN; le frontend appelle `driver-login` ou reste en démo.
2. L’accueil présente trois actions maximum et les badges de synthèse.
3. La liste ouvre la fiche mission interactive; les étapes sont issues de `missions` et `mission_stops`.
4. Les statuts, relevés kilométriques, tickets, documents et messages passent par une file IndexedDB puis sont synchronisés par RPC/Storage.
5. Les valeurs OCR sont toujours éditables et nécessitent une validation explicite.
6. Une synchronisation réussie marque les entrées hors ligne comme envoyées sans doublon.

## Risques traités

- Le schéma détaillé des policies existantes n’a pas été fourni : aucune policy existante n’est supprimée; la migration de raccordement s’arrête si la RLS des tables partagées n’est pas déjà activée.
- Les types enum des statuts métier sont inconnus : les actions chauffeur sont journalisées dans `driver_mission_events` au lieu de caster aveuglément une valeur dans `missions`.
- Le bucket `mission-documents` est privé et limité à 10 Mo : les photos sont redimensionnées et compressées avant upload.
- Le vrai OCR dépendra d’une Edge Function ou d’un fournisseur ultérieur : le produit livré prévoit le contrat d’interface et la validation humaine sans inventer une lecture.
