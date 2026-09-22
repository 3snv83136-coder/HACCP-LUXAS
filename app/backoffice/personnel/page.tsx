"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "operateur" | "responsable" | "gerant";

type Personne = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  role: Role;
  actif: boolean;
  accesBackoffice: boolean;
  aUnCode: boolean;
};

type Etab = { id: string; nom: string };

const roles: { id: Role; label: string; hint: string }[] = [
  { id: "operateur", label: "Salarié", hint: "Terrain uniquement" },
  { id: "responsable", label: "Accès back-office", hint: "Terrain + gérance" },
  { id: "gerant", label: "Gérant", hint: "Tous les droits" },
];

const vide = { prenom: "", nom: "", email: "", role: "operateur" as Role, code: "" };

export default function PersonnelPage() {
  const [items, setItems] = useState<Personne[]>([]);
  const [etabs, setEtabs] = useState<Etab[]>([]);
  const [etabId, setEtabId] = useState("");
  const [form, setForm] = useState(vide);
  const [edit, setEdit] = useState<Personne | null>(null);
  const [editCode, setEditCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load(id = etabId) {
    const qs = id ? `?etablissementId=${id}` : "";
    const res = await fetch(`/api/personnel${qs}`);
    const data = (await res.json()) as {
      items?: Personne[];
      etablissement?: Etab;
      etablissements?: Etab[];
    };
    setItems(data.items ?? []);
    setEtabs(data.etablissements ?? []);
    if (!id && data.etablissement?.id) setEtabId(data.etablissement.id);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etabId]);

  useEffect(() => {
    document.body.style.overflow = edit ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [edit]);

  const actifs = useMemo(() => items.filter((p) => p.actif), [items]);
  const archives = useMemo(() => items.filter((p) => !p.actif), [items]);

  async function creer() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, etablissementId: etabId || undefined }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Impossible d’ajouter");
      return;
    }
    setForm(vide);
    await load();
  }

  async function enregistrer() {
    if (!edit) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/personnel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: edit.id,
        prenom: edit.prenom,
        nom: edit.nom,
        email: edit.email,
        role: edit.role,
        code: editCode || undefined,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Impossible d’enregistrer");
      return;
    }
    setEdit(null);
    setEditCode("");
    await load();
  }

  async function setActif(id: string, actif: boolean) {
    await fetch("/api/personnel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actif }),
    });
    await load();
  }

  async function supprimer(id: string) {
    if (!window.confirm("Retirer cet employé de l’établissement ?")) return;
    await fetch(`/api/personnel?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Équipe</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Salariés & accès</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
            Ajoute un cuisinier, un responsable ou un gérant. Le code à 4 chiffres sert à signer
            sur le terrain. Gérant et accès back-office ouvrent ce tableau de bord.
          </p>
        </div>
        {etabs.length > 1 ? (
          <label className="block text-sm text-slate-600">
            Établissement
            <select
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:w-64"
              value={etabId}
              onChange={(e) => setEtabId(e.target.value)}
            >
              {etabs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <form
        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void creer();
        }}
      >
        <h2 className="text-lg font-semibold">Ajouter un salarié</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Prénom">
            <Input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </Field>
          <Field label="Nom">
            <Input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </Field>
          <Field label="E-mail (optionnel)">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Code terrain (4 chiffres)">
            <Input
              inputMode="numeric"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            />
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setForm({ ...form, role: r.id })}
              className={`min-h-14 rounded-2xl border px-3 py-3 text-left ${
                form.role === r.id ? "border-teal-500 bg-teal-50" : "border-slate-200"
              }`}
            >
              <p className="font-semibold">{r.label}</p>
              <p className="text-xs text-slate-500">{r.hint}</p>
            </button>
          ))}
        </div>
        {error && !edit ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full sm:w-auto" disabled={saving || form.code.length !== 4}>
          {saving ? "Enregistrement…" : "Ajouter"}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">En poste ({actifs.length})</h2>
        {actifs.length === 0 ? (
          <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">Aucun salarié actif.</p>
        ) : (
          actifs.map((p) => (
            <CartePersonne
              key={p.id}
              personne={p}
              onEdit={() => {
                setEdit(p);
                setEditCode("");
                setError(null);
              }}
              onArchive={() => void setActif(p.id, false)}
              onDelete={() => void supprimer(p.id)}
            />
          ))
        )}
      </section>

      {archives.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-500">Désactivés</h2>
          {archives.map((p) => (
            <CartePersonne key={p.id} personne={p} onRestore={() => void setActif(p.id, true)} />
          ))}
        </section>
      ) : null}

      {edit ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <form
            className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              void enregistrer();
            }}
          >
            <h2 className="text-lg font-semibold">Modifier {edit.prenom}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prénom">
                <Input value={edit.prenom} onChange={(e) => setEdit({ ...edit, prenom: e.target.value })} />
              </Field>
              <Field label="Nom">
                <Input value={edit.nom} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} />
              </Field>
              <Field label="E-mail">
                <Input
                  type="email"
                  value={edit.email ?? ""}
                  onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                />
              </Field>
              <Field label="Nouveau code (optionnel)">
                <Input
                  inputMode="numeric"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Laisser vide pour garder"
                />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setEdit({ ...edit, role: r.id })}
                  className={`min-h-14 rounded-2xl border px-3 py-3 text-left ${
                    edit.role === r.id ? "border-teal-500 bg-teal-50" : "border-slate-200"
                  }`}
                >
                  <p className="text-sm font-semibold">{r.label}</p>
                </button>
              ))}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setEdit(null)}>
                Annuler
              </Button>
              <Button disabled={saving}>{saving ? "…" : "Enregistrer"}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function CartePersonne({
  personne,
  onEdit,
  onArchive,
  onDelete,
  onRestore,
}: {
  personne: Personne;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}) {
  const role = roles.find((r) => r.id === personne.role);
  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold">
          {personne.prenom} {personne.nom}
        </p>
        <p className="truncate text-sm text-slate-500">{personne.email || "Pas d’e-mail"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={personne.accesBackoffice ? "info" : "default"}>{role?.label}</Badge>
          {personne.accesBackoffice ? <Badge variant="ok">Back-office</Badge> : <Badge>Terrain</Badge>}
          {personne.aUnCode ? <Badge variant="ok">Code actif</Badge> : <Badge variant="warn">Sans code</Badge>}
        </div>
      </div>
      <div className="flex gap-2">
        {onEdit ? (
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={onEdit}>
            Modifier
          </Button>
        ) : null}
        {onArchive ? (
          <Button variant="ghost" className="flex-1 sm:flex-none" onClick={onArchive}>
            Désactiver
          </Button>
        ) : null}
        {onDelete ? (
          <Button variant="ghost" className="flex-1 text-red-700 sm:flex-none" onClick={onDelete}>
            Supprimer
          </Button>
        ) : null}
        {onRestore ? (
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={onRestore}>
            Réactiver
          </Button>
        ) : null}
      </div>
    </article>
  );
}
