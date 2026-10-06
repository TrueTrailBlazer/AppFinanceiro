-- Create storage bucket for receipts
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);

-- Set up RLS for the storage bucket
create policy "Users can upload their own receipts"
  on storage.objects for insert
  with check ( bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can view their own receipts"
  on storage.objects for select
  using ( bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can update their own receipts"
  on storage.objects for update
  using ( bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete their own receipts"
  on storage.objects for delete
  using ( bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1] );

-- Add receipt_url column to transactions table
alter table public.transactions add column receipt_url text;
