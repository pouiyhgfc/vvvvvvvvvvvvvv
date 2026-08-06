// Centrale status-helpers voor log-entries (archief/prullenbak). Eén plek
// i.p.v. losse `!e.archivedAt`-checks verspreid over de queries, zodat een
// verwijderde of gearchiveerde entry nergens per ongeluk weer opduikt (bv.
// als "notitie van vandaag" in de tracker).
export const isTrashed = (e) => !!e.deletedAt;
export const isArchived = (e) => !!e.archivedAt && !isTrashed(e);
export const isActive = (e) => !isTrashed(e) && !isArchived(e);
