-- Explorers replace the octopus: each player picks a drawn explorer as their avatar.
-- The ids match EXPLORER_IDS in packages/shared/src/explorers.ts (catalog-sync.test.ts checks).
-- Null means "not chosen yet": the app then draws a steady default from the player's id.

alter table public.profiles add column explorer text
  check (explorer in ('e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'));

-- Players choose their own explorer, like their username or home city.
grant update (explorer) on public.profiles to authenticated;

-- Store skins are now outfits: the colour of your explorer's jacket. Codes and prices are unchanged.
update public.shop_items set name = 'Atlantic jacket' where code = 'skin_ocean';
update public.shop_items set name = 'Coral jacket' where code = 'skin_coral';
update public.shop_items set name = 'Midnight coat' where code = 'skin_midnight';
update public.shop_items set name = 'Golden jacket' where code = 'skin_gold';
update public.shop_items
  set description = 'A glowing incense circle around your explorer and a guiding line to your next adventure.'
  where code = 'incense_30';

-- The Sintra badge wore the octopus; it gets the hills at sunrise instead.
update public.badges set emoji = '🌄' where code = 'sintra_complete';
