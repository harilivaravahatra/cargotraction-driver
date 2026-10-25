# CargoTraction Chauffeurs — TODO

## Socle applicatif et identité visuelle

- [ ] Le projet s’installe avec `npm install` puis démarre avec `npm run dev`.
- [ ] L’application utilise React 18, TypeScript, Vite, TailwindCSS, `@supabase/supabase-js` et `lucide-react`.
- [ ] L’interface est mobile-first, en une seule colonne, avec texte d’au moins 16 px, cibles tactiles d’au moins 48 px, contraste fort et utilisation possible avec des gants.
- [ ] L’accueil n’affiche jamais plus de trois gros boutons principaux : MES MISSIONS, SCANNER-PHOTOS et MESSAGES.
- [ ] Le thème utilise le Bleu Bassin `#0e5165`, `bg-slate-50`, des cartes blanches `rounded-2xl` et des ombres douces.
- [ ] Le composant `LogoSlot` est livré comme emplacement vide pour le logo CargoTraction.
- [ ] Le manifeste PWA et `public/manus-routes.json` sont présents et synchronisés avec les routes.

## Authentification et sécurité

- [ ] Une migration ajoute uniquement les colonnes nullable `pin_hash text`, `auth_user_id uuid` et `app_access_enabled boolean default false` à `public.drivers`.
- [ ] `driver-login` accepte un `employee_code` et un PIN numérique de 4 à 6 chiffres, compare le hash côté serveur, crée au premier succès le compte technique `driver-<code>@drivers.internal`, puis renvoie une vraie session Supabase.
- [ ] `driver-set-pin` est accessible uniquement aux rôles `admin` et `dispatcher`.
- [ ] Les policies existantes ne sont ni supprimées ni remplacées.
- [ ] Les chauffeurs ne lisent que leurs propres missions, stops et documents via RLS Supabase.
- [ ] Les chauffeurs n’écrivent jamais directement dans `missions`; les écritures passent par des RPC `SECURITY DEFINER` isolées qui vérifient l’appartenance et journalisent l’action.

## Missions et preuves terrain

- [ ] Les missions en cours et l’historique sont listés.
- [ ] La fiche mission est interactive et chargée depuis `missions` et `mission_stops`.
- [ ] La fiche affiche les adresses, étapes, conteneur, type, poids et les champs disponibles comme plomb, booking, IMCO/ONU et reefer.
- [ ] Les téléphones utilisent des liens `tel:` et le bouton Itinéraire ouvre Google Maps avec une URL `query` encodée.
- [ ] Les actions de statut proposées sont Prise en charge, Arrivé et Livré.
- [ ] Les photos compteur départ/arrivée utilisent `capture="environment"`; la valeur est saisie ou corrigée par le chauffeur et une éventuelle suggestion OCR doit être validée humainement.
- [ ] Le ticket carburant permet photo, suggestion OCR optionnelle, correction manuelle et contrôle litres × prix approximativement égal au total.
- [ ] Les CMR et bons de livraison sont compressés avant upload dans le bucket privé `mission-documents`.

## Hors-ligne et messagerie

- [ ] IndexedDB conserve les statuts, photos, tickets et messages quand le réseau est indisponible.
- [ ] Chaque action hors ligne possède un identifiant unique côté client et ne peut pas être appliquée deux fois lors de la synchronisation.
- [ ] La synchronisation est automatique à la reconnexion et affiche l’état de la file.
- [ ] La messagerie est organisée par mission et propose un accusé de lecture.

## SQL et backend Supabase

- [ ] Les migrations SQL sont numérotées pour `driver_mission_events`, `odometer_readings`, `fuel_tickets` et `mission_messages`.
- [ ] Les nouvelles tables ont RLS activée et des policies dédiées au chauffeur.
- [ ] Les fonctions d’aide, RPC et triggers dédiés portent des noms isolés et ne modifient pas les fonctions métier existantes.
- [ ] Le README explique l’ordre d’exécution, les variables d’environnement, les Edge Functions, les buckets et les limites connues.

## Démo et livraison

- [ ] `VITE_DEMO_MODE=true` permet de tester sans Supabase avec des données de démonstration.
- [ ] Le projet fournit un guide Capacitor pour empaqueter l’application en APK.
- [ ] Le projet est vérifié par build TypeScript/Vite et livré dans une archive ZIP complète.
