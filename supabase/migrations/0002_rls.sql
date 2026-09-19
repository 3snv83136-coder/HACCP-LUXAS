-- RLS : un membre ne voit que ses établissements.
-- gerant : toute l'organisation. lecture : SELECT only.
-- Tables de relevé : INSERT autorisé, UPDATE/DELETE refusés.

alter table haccp.etablissement enable row level security;
alter table haccp.utilisateur enable row level security;
alter table haccp.membre_etablissement enable row level security;
alter table haccp.code_operateur enable row level security;
alter table haccp.equipement enable row level security;
alter table haccp.point_controle enable row level security;
alter table haccp.plan_frequence enable row level security;
alter table haccp.releve_temperature enable row level security;
alter table haccp.reception enable row level security;
alter table haccp.lot_produit enable row level security;
alter table haccp.plat_temoin enable row level security;
alter table haccp.produit_nettoyage enable row level security;
alter table haccp.tache_nettoyage enable row level security;
alter table haccp.execution_nettoyage enable row level security;
alter table haccp.checklist enable row level security;
alter table haccp.checklist_item enable row level security;
alter table haccp.checklist_execution enable row level security;
alter table haccp.huile_friture enable row level security;
alter table haccp.releve_huile enable row level security;
alter table haccp.nuisibles_passage enable row level security;
alter table haccp.formation enable row level security;
alter table haccp.non_conformite enable row level security;
alter table haccp.document_pms enable row level security;
alter table haccp.parametre enable row level security;
alter table haccp.audit_log enable row level security;

create or replace function haccp.etablissements_visibles()
returns setof text
language sql
stable
security definer
set search_path = haccp, public
as $$
  select me.etablissement_id
  from haccp.membre_etablissement me
  join haccp.utilisateur u on u.id = me.utilisateur_id
  where u.auth_uid = auth.uid()
    and me.actif = true
    and u.actif = true
  union
  select e.id
  from haccp.etablissement e
  join haccp.membre_etablissement me on me.etablissement_id = e.id
  join haccp.utilisateur u on u.id = me.utilisateur_id
  where u.auth_uid = auth.uid()
    and me.role = 'gerant'
    and me.actif = true;
$$;

create or replace function haccp.peut_ecrire(etab_id text)
returns boolean
language sql
stable
security definer
set search_path = haccp, public
as $$
  select exists (
    select 1
    from haccp.membre_etablissement me
    join haccp.utilisateur u on u.id = me.utilisateur_id
    where u.auth_uid = auth.uid()
      and me.etablissement_id = etab_id
      and me.actif
      and me.role in ('operateur','responsable','gerant')
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'equipement','point_controle','plan_frequence','lot_produit','plat_temoin',
    'produit_nettoyage','tache_nettoyage','checklist','huile_friture',
    'nuisibles_passage','non_conformite','document_pms'
  ]
  loop
    execute format(
      'create policy %I_select on haccp.%I for select using (etablissement_id in (select haccp.etablissements_visibles()));',
      t, t
    );
    execute format(
      'create policy %I_write on haccp.%I for insert with check (haccp.peut_ecrire(etablissement_id));',
      t, t
    );
    execute format(
      'create policy %I_update on haccp.%I for update using (haccp.peut_ecrire(etablissement_id));',
      t, t
    );
  end loop;
end $$;

-- Append-only
create policy releve_select on haccp.releve_temperature
  for select using (etablissement_id in (select haccp.etablissements_visibles()));
create policy releve_insert on haccp.releve_temperature
  for insert with check (haccp.peut_ecrire(etablissement_id));

create policy reception_select on haccp.reception
  for select using (etablissement_id in (select haccp.etablissements_visibles()));
create policy reception_insert on haccp.reception
  for insert with check (haccp.peut_ecrire(etablissement_id));

create policy exec_select on haccp.execution_nettoyage
  for select using (etablissement_id in (select haccp.etablissements_visibles()));
create policy exec_insert on haccp.execution_nettoyage
  for insert with check (haccp.peut_ecrire(etablissement_id));

create policy audit_select on haccp.audit_log
  for select using (etablissement_id in (select haccp.etablissements_visibles()));
create policy audit_insert on haccp.audit_log
  for insert with check (haccp.peut_ecrire(etablissement_id));

create policy parametre_select on haccp.parametre
  for select using (
    organisation_id in (
      select e.organisation_id from haccp.etablissement e
      where e.id in (select haccp.etablissements_visibles())
    )
  );
