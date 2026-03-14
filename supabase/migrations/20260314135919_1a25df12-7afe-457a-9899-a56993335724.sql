-- Remove CRM contact links to non-test customers first
UPDATE public.crm_contacts 
SET customer_id = NULL 
WHERE brand_id = '8f76ce52-d6c0-4c90-af67-79957e97e477'
AND customer_id IS NOT NULL
AND customer_id NOT IN (
  '0bc0063f-b740-4817-9032-25922cd9b762',
  '105bda70-8e11-483f-abcb-1e1dde53fb4e',
  '3cbfd437-6777-4785-a7ee-aff1a42e7940'
);

-- Now delete non-test customers
DELETE FROM public.customers 
WHERE brand_id = '8f76ce52-d6c0-4c90-af67-79957e97e477' 
AND id NOT IN (
  '0bc0063f-b740-4817-9032-25922cd9b762',
  '105bda70-8e11-483f-abcb-1e1dde53fb4e',
  '3cbfd437-6777-4785-a7ee-aff1a42e7940'
);