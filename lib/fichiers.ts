export const TAILLE_MAX_PIECE = 3_500_000;

export type PieceSaisie = {
  nom: string;
  mime: string;
  contenu: string;
};

export function pieceValide(piece: PieceSaisie) {
  if (!piece.nom.trim() || !piece.contenu.startsWith("data:")) return false;
  if (piece.contenu.length > TAILLE_MAX_PIECE) return false;
  return true;
}

export function lireFichierDataUrl(file: File, max = TAILLE_MAX_PIECE): Promise<PieceSaisie> {
  return new Promise((resolve, reject) => {
    if (file.size > max) {
      reject(new Error("Fichier trop lourd (max 3,5 Mo)"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.onload = () => {
      const contenu = String(reader.result ?? "");
      if (!contenu.startsWith("data:")) {
        reject(new Error("Fichier illisible"));
        return;
      }
      if (contenu.length > max) {
        reject(new Error("Fichier trop lourd (max 3,5 Mo)"));
        return;
      }
      resolve({
        nom: file.name || "fichier",
        mime: file.type || "application/octet-stream",
        contenu,
      });
    };
    reader.readAsDataURL(file);
  });
}
